const { Stack, RemovalPolicy, SecretValue } = require('aws-cdk-lib');
const s3 = require('aws-cdk-lib/aws-s3');
const codeborder = require('aws-cdk-lib/aws-codebuild');
const codepipeline = require('aws-cdk-lib/aws-codepipeline');
const codepipeline_actions = require('aws-cdk-lib/aws-codepipeline-actions');
const cloudfront = require('aws-cdk-lib/aws-cloudfront');
const origins = require('aws-cdk-lib/aws-cloudfront-origins');
const s3deploy = require('aws-cdk-lib/aws-s3-deployment');
const iam = require('aws-cdk-lib/aws-iam');

class DevopsWorkshopGameStack extends Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    // 1. Target S3 Bucket for Hosting the Game
    const websiteBucket = new s3.Bucket(this, 'WebsiteBucket', {
      websiteIndexDocument: 'index.html',
      publicReadAccess: true,
      // EXPLICITLY disable all public access blocks
      blockPublicAccess: new s3.BlockPublicAccess({
        blockPublicAcls: false,
        ignorePublicAcls: false,
        blockPublicPolicy: false,
        restrictPublicBuckets: false,
      }),
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // 1.5 CDN Infrastructure for Assets
    const assetsBucket = new s3.Bucket(this, 'AssetsBucket', {
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    const cdnDistribution = new cloudfront.Distribution(this, 'AssetsCDN', {
      defaultBehavior: { 
        origin: new origins.S3Origin(assetsBucket),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
    });

    new s3deploy.BucketDeployment(this, 'DeployAssets', {
      sources: [s3deploy.Source.asset('./frontend/src/assets')],
      destinationBucket: assetsBucket,
      distribution: cdnDistribution,
      distributionPaths: ['/*'],
    });

    // 2. Define Pipeline Artifacts
    const sourceOutput = new codepipeline.Artifact();
    const buildOutput = new codepipeline.Artifact();

    // 3. Create CodeBuild Project
    const buildProject = new codeborder.PipelineProject(this, 'BuildProject', {
      environment: {
        buildImage: codeborder.LinuxBuildImage.STANDARD_7_0, // Node.js runtime environment
        environmentVariables: {
          VITE_CDN_URL: { value: `https://${cdnDistribution.distributionDomainName}` }
        }
      },
      // Instead of an external file, we embed the buildspec directly in the infrastructure
      buildSpec: codeborder.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            'runtime-versions': {
              nodejs: '20'
            },
            commands: [
              'npm install --prefix frontend'
            ]
          },
          build: {
            commands: [
              'npm run build --prefix frontend'
            ]
          }
        },
        artifacts: {
          'base-directory': 'frontend/dist', // Tells AWS to grab the compiled Vite assets
          files: [
            '**/*'
          ]
        }
      })
    });

    buildProject.addToRolePolicy(new iam.PolicyStatement({
      actions: [
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents'
      ],
      resources: [
        `arn:aws:logs:${Stack.of(this).region}:${Stack.of(this).account}:log-group:/aws/codebuild/${buildProject.projectName}`,
        `arn:aws:logs:${Stack.of(this).region}:${Stack.of(this).account}:log-group:/aws/codebuild/${buildProject.projectName}:*`
      ]
    }));

    // 4. Assemble the Pipeline
    new codepipeline.Pipeline(this, 'WorkshopPipeline', {
      pipelineName: 'DevOps-Workshop-Game-Pipeline',
      stages: [
        {
          stageName: 'Source',
          actions: [
            new codepipeline_actions.GitHubSourceAction({
              actionName: 'GitHub_Source',
              owner: 'chalorejo',
              repo: 'devops-workshop-game',
              branch: 'main',
              // You will create a GitHub token and store it in AWS Secrets Manager
              oauthToken: SecretValue.secretsManager('workshop/github', { jsonField: 'token' }),
              output: sourceOutput,
            }),
          ],
        },
        {
          stageName: 'Build',
          actions: [
            new codepipeline_actions.CodeBuildAction({
              actionName: 'Vite_Build',
              project: buildProject,
              input: sourceOutput,
              outputs: [buildOutput],
            }),
          ],
        },
        {
          stageName: 'Deploy',
          actions: [
            new codepipeline_actions.S3DeployAction({
              actionName: 'S3_Deploy',
              bucket: websiteBucket,
              input: buildOutput,
            }),
          ],
        },
      ],
    });
  }
}

module.exports = { DevopsWorkshopGameStack };