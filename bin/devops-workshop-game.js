#!/usr/bin/env node

const cdk = require('aws-cdk-lib');
const { DevopsWorkshopGameStack } = require('../lib/devops-workshop-game-stack');

const app = new cdk.App();

new DevopsWorkshopGameStack(app, 'DevopsWorkshopGameStack', {
  /* If you don't specify this, CDK might default to us-east-1
     and fail to find your secret! */
  env: {
    account: '417673081085', // Your AWS Account ID from the ARN
    region: 'ap-southeast-1'  // The region where you created the secret
  },
});
