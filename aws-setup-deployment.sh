#!/bin/bash

# LABUREMOS AWS Deployment Setup Script
# This script guides you through setting up AWS CLI and deploying the infrastructure

set -e

echo "🚀 LABUREMOS AWS Deployment Setup"
echo "=================================="
echo ""

# Check if AWS CLI is installed
if ! command -v ~/.local/bin/aws &> /dev/null; then
    echo "❌ AWS CLI not found. Please install AWS CLI first."
    echo "Run: curl 'https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip' -o 'awscliv2.zip' && unzip awscliv2.zip && ./aws/install --install-dir ~/.local/aws-cli --bin-dir ~/.local/bin"
    exit 1
fi

echo "✅ AWS CLI found at ~/.local/bin/aws"

# Check if AWS CLI is configured
if ! ~/.local/bin/aws sts get-caller-identity &> /dev/null; then
    echo ""
    echo "⚙️  AWS CLI Configuration Required"
    echo "Please follow these steps:"
    echo ""
    echo "1. Go to AWS Console: https://us-east-1.console.aws.amazon.com/console/home"
    echo "2. Navigate to IAM > Users"
    echo "3. Create user 'laburemos-cli-user' with PowerUserAccess policy"
    echo "4. Generate Access Keys and download the CSV"
    echo ""
    read -p "Press Enter when you have your Access Key ID and Secret Access Key ready..."
    echo ""
    
    echo "Configuring AWS CLI..."
    ~/.local/bin/aws configure
    
    echo ""
    echo "Testing AWS CLI configuration..."
    if ~/.local/bin/aws sts get-caller-identity; then
        echo "✅ AWS CLI configured successfully!"
    else
        echo "❌ AWS CLI configuration failed. Please check your credentials."
        exit 1
    fi
else
    echo "✅ AWS CLI already configured"
    ~/.local/bin/aws sts get-caller-identity
fi

echo ""
echo "📋 Current Configuration:"
~/.local/bin/aws configure list

echo ""
echo "🏗️  Infrastructure Deployment Options:"
echo "1. Deploy Staging Environment (Recommended first)"
echo "2. Deploy Production Environment"
echo "3. Deploy Both Environments"
echo "4. Skip infrastructure deployment (if already deployed)"

read -p "Select option (1-4): " DEPLOY_OPTION

case $DEPLOY_OPTION in
    1)
        echo "🔄 Deploying Staging Infrastructure..."
        ~/.local/bin/aws cloudformation deploy \
            --template-file infrastructure/aws/cloudformation-staging.yml \
            --stack-name laburemos-staging \
            --capabilities CAPABILITY_IAM \
            --parameter-overrides \
                Environment=staging \
                DomainName=staging.laburemos.com \
            --region us-east-1
        
        echo "✅ Staging infrastructure deployed!"
        ;;
    2)
        echo "🔄 Deploying Production Infrastructure..."
        ~/.local/bin/aws cloudformation deploy \
            --template-file infrastructure/aws/cloudformation-production.yml \
            --stack-name laburemos-production \
            --capabilities CAPABILITY_IAM \
            --parameter-overrides \
                Environment=production \
                DomainName=laburemos.com \
            --region us-east-1
        
        echo "✅ Production infrastructure deployed!"
        ;;
    3)
        echo "🔄 Deploying Both Environments..."
        
        echo "Deploying Staging..."
        ~/.local/bin/aws cloudformation deploy \
            --template-file infrastructure/aws/cloudformation-staging.yml \
            --stack-name laburemos-staging \
            --capabilities CAPABILITY_IAM \
            --parameter-overrides \
                Environment=staging \
                DomainName=staging.laburemos.com \
            --region us-east-1
        
        echo "Deploying Production..."
        ~/.local/bin/aws cloudformation deploy \
            --template-file infrastructure/aws/cloudformation-production.yml \
            --stack-name laburemos-production \
            --capabilities CAPABILITY_IAM \
            --parameter-overrides \
                Environment=production \
                DomainName=laburemos.com \
            --region us-east-1
        
        echo "✅ Both environments deployed!"
        ;;
    4)
        echo "⏩ Skipping infrastructure deployment"
        ;;
    *)
        echo "❌ Invalid option selected"
        exit 1
        ;;
esac

echo ""
echo "📊 Deployment Status:"
echo "===================="

# Check CloudFormation stacks
echo ""
echo "CloudFormation Stacks:"
~/.local/bin/aws cloudformation list-stacks \
    --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE \
    --query 'StackSummaries[?contains(StackName, `laburemos`)].{Name:StackName,Status:StackStatus}' \
    --output table

# Get stack outputs if available
STAGING_STACK=$(~/.local/bin/aws cloudformation list-stacks --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE --query 'StackSummaries[?StackName==`laburemos-staging`].StackName' --output text)
PROD_STACK=$(~/.local/bin/aws cloudformation list-stacks --stack-status-filter CREATE_COMPLETE UPDATE_COMPLETE --query 'StackSummaries[?StackName==`laburemos-production`].StackName' --output text)

if [ ! -z "$STAGING_STACK" ]; then
    echo ""
    echo "🧪 Staging Environment URLs:"
    ~/.local/bin/aws cloudformation describe-stacks \
        --stack-name laburemos-staging \
        --query 'Stacks[0].Outputs[?contains(OutputKey, `URL`)].{Key:OutputKey,Value:OutputValue}' \
        --output table
fi

if [ ! -z "$PROD_STACK" ]; then
    echo ""
    echo "🚀 Production Environment URLs:"
    ~/.local/bin/aws cloudformation describe-stacks \
        --stack-name laburemos-production \
        --query 'Stacks[0].Outputs[?contains(OutputKey, `URL`)].{Key:OutputKey,Value:OutputValue}' \
        --output table
fi

echo ""
echo "🔧 Next Steps:"
echo "============="
echo "1. Configure GitHub Secrets using the guide: CI-CD-DEPLOYMENT-GUIDE.md"
echo "2. Push code to GitHub to trigger CI/CD pipeline"
echo "3. Monitor deployment progress in Actions tab"
echo "4. Verify application URLs when deployment completes"
echo ""
echo "📚 Useful Commands:"
echo "# Check stack status:"
echo "~/.local/bin/aws cloudformation describe-stacks --stack-name laburemos-staging"
echo ""
echo "# View CloudWatch logs:"
echo "~/.local/bin/aws logs describe-log-groups --log-group-name-prefix /ecs/laburemos"
echo ""
echo "# List ECS services:"
echo "~/.local/bin/aws ecs list-services --cluster laburemos-staging"
echo ""
echo "✅ Setup Complete! Check the deployment guide for next steps."