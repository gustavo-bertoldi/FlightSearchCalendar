
# **Create an automatic CI/CD pipeline with Github and AWS**

>This tutorial is a walkthrough guide to setup ann automatic **Continuous integration** and **Continuous deployment** pipeline using *Github Actions*, *AWS EC2* and *AWS CodeDeploy* services.

## Introduction to the services
- **Github Actions**: This service allows us to execute code triggered by an event in the repository. For example we can run a tests suit triggered by the push action into a specific branch. This guide will show you how to trigger a build and deploy process automatically when code is pushed into a repository.
- **AWS EC2**: This service allows us to run a server instance on the cloud. We are going to use it to host a linux instance and use it to host our application.
- **AWS CodeDeploy**: This service manages the code deployment to our instance in AWS EC2. It injects the files from the Github repository into our instance and execute the necessary commands to start the application.
- **AWS Secrets Manager**: This service is used to store secret credentials that are securely encrypted. We will use this service to store ou Amadeus credentials so we don't need to hardcode it anywhere in our files.
- **AWS CloudWatch**: This service allow for monitoring and observability of AWS resources. We will configure it to notify us if there is something wrong with our instance and automatically reboot it if needed.

## Prerequisites
- An account on AWS, all the features used are available in the free tier.
- A Github account and a repository containing the application you want to deploy. In this tutorial we will use a dockerized application.
- Optionally you can use the same application we use in the guide, clone or fork the AWS branch of the repository [here](https://github.com/gustavo-bertoldi/FlightSearchCalendar/tree/AWS).

# Configuring AWS

First we are going to set up **IAM Roles** in AWS that we are going to use in the EC2 instance and CodeDeploy. Role allows EC2 instance to call AWS services on your behalf, avoiding aditional authentification steps and facilitating the configuration.

---

## EC2 role

This role is responsible for allowing the following:
* Allow the instance to access the **CodeDeploy** service.
* Allow the instance to access secrets from **Secets Manager**.
* Allow the instance to push logs to the **CloudWatch** service.

To start, go to the **IAM** service using the search bar in tou AWS dashboard.
First we are going to create a new **police** allowing the instance to push logs to **CloudWatch** service. 
In the **IAM** service, in the menu on the left, select **Policies** under **Access management**, then select **Create policy** on the right. A new screen is going to open, select the **JSON** tab and paste the following code in the text field:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Action": [
                "logs:CreateLogStream",
                "logs:PutLogEvents",
                "logs:CreateLogGroup"
            ],
            "Effect": "Allow",
            "Resource": "*"
        }
    ]
}
```

Click on **Next: Tags**, and then **Next: Review**. In the **Review police** window, enter *CloudWatchPushLogs* as the police's name and click on **Create police** in the page's bottom.

Once the police is created, go back to the **IAM** service dashboard and in the menu on the left, click on **Roles** under **Access management** and then on **Create role** in the right, a new screen in going to open.

Select **AWS service** under **Trusted entity type** and **EC2** under **Use case** and click on next.

In the next screen you will have the possibility to attach policies to your role. We need the following policies:
* AmazonEC2RoleforAWSCodeDeploy
* SecretManagerReadWrite
* CloudWatchPushLogs

Yo can search policies using the search bar and select them using the checkbox to the left of its name. Select the three listed polices and click on next. In the **Name, review and create** window enter ***EC2Role*** for the name, leaving the rest as default, and click on **Create role** on the bottom.

---

## CodeDeploy role

This role will be responsible for the following:
* Providing full access to Amazon EC2 instances. Allowing the service to download the source files in the instance and execute scripts.
* Provides CodeDeploy service access to expand tags and interact with Auto Scaling on your behalf.

Now we are going to create a role for the **CodeDeploy** service. To do it follow the same steps as before. We are going to name it **CodeDeployRole**. In the permissions screen, add the following permissions:
* AmazonEC2FullAccess  
* AWSCodeDeployRole

---

## GitHub User

Now let's create an IAM user, which will be used by GitHub to connect to our instance. Go to the **IAM** service and in the **Identity and Access Management (IAM)** menu in the left, select **Users** under **Access management** and then **Add users** in the right. Choose a name and select **Access key - Programmatic access** under **Select AWS access type**.
Next, on the permissions screen, select **Attach existing policies directly** and add **AWSCodeDeployFullAccess** from the policies.
Click on next leaving everything as default until you see the user is created successfully, you will be shown a screen containing the user's **Access key ID** and **Secret access key**, keep both in a safe place, you will need them later in the tutorial.

## Configure CloudWatch
In this section we are going to configure **CloudWatch** for our application.

Go to the **CloudWatch** service and select **Log groups** under **Logs** on the menu in the left. Now select **Create log group** on the right. Give it a name and select the **Retention setting** that's most convenient for your needs and click on **Create** on the bottom of the page. Now select the log group you just created, and in the bottom portion select **Create log stream** and give it a name.

## Configure Secrets Manager

For this section we are going to configure AWS's **Secrets Manager** service to securely store our Amadeus credentials.
Go to the **Secrets Manager dashboard** and click on **Store a new secret**. Seelct **Other type of secret** under **Secret type** and add the key value pairs for `AMADEUS_CLIENT_ID` and `AMADEUS_CLIENT_SECRET` keys and click on next.

Add a name that alow you to quickly find your secret, for example `MyApp/AMADEUS_CLIENT_ID`. Leave everything else as default and click on **Next**.

In the next window you can configure automatic rotation of your secrets if you want, as we don't need this feature for our Amadeus credentials you can just click on **Next**.

Next you are going to be shown the review page. In the bottom of this page there is some code examples on how to retrieve your secret using AWS SDK in various languages. Click on **Store** to save it.

## Create an EC2 instance

In this step we will create a virtualized linux machine, in which our docker container will run. We will allow SSH, HTTP and HTTPS traffic, but you can custonomize your instance's network polices later.

Go to the **EC2** service and on the **EC2 Dashboard** click on **Launch Instance**

On the **Launch an instance** page, enter the following configuration. Leave no mentioned settings as default:

- **Name and tags**:
  - **Name**: MyApp (Or anything else)
- **Application and OS Images (Amazon Machine Image)**:
  - **Amazon Machine Image (AMI)**: Amazon Linux 2 AMI (HVM) - Kernel 5.10, SSD Volume Type
  - **Architecture**: 64-bit (x86)
- **Instance type**: t2.micro
- **Key pair (login)**: Optional: here you can create a key pair if you want to connect to your instance using ```ssh``` later.
- **Network settings**:
  - **Firewall (security groups)**: Create security group
    - **Allow SSH traffic from**: Checked, Anywhere 0.0.0.0/0
    - **Allow HTTPs traffic from the internet**: Checked
    - **Allow HTTP traffic from the internet**: Checked
- **Advanced details**:
  - **IAM instance profile**: EC2Role (The one we created before)


Click on launch instance to finish creation.

To personalize your network security group and allow other traffic, Go to the **EC2** service and select the instance you created, on the **Instance summary** page, on the bottom, select the **Security** tab, and click on **Security groups**, you'll be able to edit the inbound and outbound rules of your instance.

## Prepare EC2 instance

With the new instance created, select it in the **Instances** list and click on connect to access it, note you will have to wait for the instance to be initilized before connecting, this process can take a couple of minutes. Alternatively, you can connect to it using the `ssh` key generated earlier.

Now we are going to install the necessary services in the instance in order to run our application and the automatic deployment.

### Install CodeDeploy Agent 
Run the followings commands to install the **codeDeploy-agent**:

To get the correct link to use in the `wget` command you need to replace *bucket-name* and *region-identifier* with the information from your AWS region, which can be found [here](https://docs.aws.amazon.com/codedeploy/latest/userguide/resource-kit.html#resource-kit-bucket-names): 

```bash
sudo yum update
sudo yum install -y ruby
sudo yum install wget
sudo wget https://bucket-name.s3.region-identifier.amazonaws.com/latest/install
chmod +x ./install
sudo ./install auto
sudo service codedeploy-agent start
rm ./install
```

### Install Docker

```bash
sudo yum install -y docker
sudo groupadd docker # You might get an error saying the group already exists, ignore it

# Add permissions for docker
sudo usermod -aG docker ${USER}

# Configure docker to start on system startup
sudo systemctl enable docker.service 
sudo systemctl enable containerd.service

# Start the docker daemon
sudo service docker start
```

### Install CloudWatch Agent

Run the following command to install the **CloudWatch Agent**.

```bash
sudo yum install amazon-cloudwatch-agent
```

Create a new file in `/etc/docker/daemon.json` containing the following, dont forget to replace the fields with your CloudWatch information. This will tell Docker to send the containers' logs to **CloudWatch**.

```json
{
  "log-driver": "awslogs",
  "log-opts": {
    "awslogs-region": "YOUR_REGION",
    "awslogs-group" : "YOUR_LOGS_GROUP",
    "awslogs-stream": "YOUR_STREAM"
  }
}
```

Then restart the docker service with the following command:

```bash
sudo service docker restart
```

## **CodeDeploy configuration**

Search for **CodeDeploy** on AWS, In the menu on the left select **Getting started** under **Deploy** and then **Create application** on the right.

Create an application with any name, we will use *MyAppDeploy*, and **EC2/On-premises** compute platform. You will need the name of the application later when configuring GitHub.

Once the application is created, go to the **Applications** dashboard, under **Deploy** in the menu on the left. Click on your newly created application and then on **Create deployment group**.
Choose a name for the deployment group, we will use *MyAppDG*. For the service role choose the IAM role we created early (**CodeDeployRole**) and for the deployment type choose **In-place**. You will need the name of the deployment group later when configuring GitHub.

For the **Environment configuration** choose **Amazon EC2 instances** and enter ***Name*** on the **Key** field and the name of your isntance on the **Value** field. You should see **1 unique matched instance** under **Amazon EC2 instances**, otherwise verify the name and tags of your instance.

For the **Agent configuration with AWS Systems Manager** leave as default. Finally, select **CodeDeployDefault.OnceAtATime** under **Deployment settings** and disable load balancing under **Load balancer**. Click on **Create deployment group**.

## **Application configuration**
At this point, all the needed services should be correctly created and configures on AWS. In this section we are going to create an `appspec.yml` file to tell AWS how to build and deploy our application.

If you used our example application you can use the `appspec.yml` file we provided. Otherwise you can check the details on how to write this file [here](https://docs.aws.amazon.com/codedeploy/latest/userguide/reference-appspec-file.html).

```yml
version: 0.0
os: linux
files:
  - source: /
    destination: /home/ec2-user/FlightSearchApp
    overwrite: true

permissions:
  - object: /
    pattern: "**"
    owner: ec2-user
    group: ec2-user

hooks:
  BeforeInstall:
    - location: /AWS/scripts/stop.sh
      timeout: 120
      runas: ec2-user
  AfterInstall:
    - location: /AWS/scripts/build.sh
      timeout: 300
      runas: ec2-user
  ApplicationStart:
    - location: /AWS/scripts/start.sh
      timeout: 120
      runas: ec2-user
```

Here is a quick description of each section on this **AppSpec** file:
  - `version`: version number, usually 0.0
  - `os`: OS running in the target instance
  - `files`: In this section you can specify which files are going to be copied to your instance, using source and destination directories. In this examples we copied all the code in the repository's root `.` to `/home/ec2-user/FlightSearchApp/` in our instance.
  - `permissions`: Permission with which the scripts are going to be executed, we are going to use the standard user of AWS's EC2 instances. `ec2-user`.
  - `hooks`: Steps of the deployment process, after which the specified code is going to be executed. In this example, we use the `BeforeInstall` hook, which triggered before files are copied, we use it to stop our current container and delete previous images. Then we use the  `AfterInstall` hook, which is triggered after the new files were copied to build the docker images. Finally we use `ApplicationStart` hook to run our docker image. You can get more detail on AWS CodeDeploy hooks [here](https://docs.aws.amazon.com/codedeploy/latest/userguide/reference-appspec-file-structure-hooks.html).

## **Scripts**
In this example we use three simple scripts:
* `stop.sh` : stops the current continer and erase previous images. Prepare for new version.
* `build.sh` : builds the new docker image.
* `start.sh` : fetch Amadeus credentials and launch the docker container.

You can check the detailed implementation of each script in the folder `/AWS/scripts`.

# Configuring GitHub

At this point all the configuration on AWS side should be completed correctly. We are now going to configure a **GitHub Actions** to trigger the deployment when new code is pushed to the repository.
Lets start by setting up our GitHub Action. Create the file `.github/workflows/aws_ci_cd.yml`. The `.github` folder must be located on the root of your repository. In this tutorial we will create a simple workflow triggered by the **push** action in our repository's `master` branch. You can get more information on GitHub Actions [here](https://docs.github.com/en/actions).

To deploy to AWS we need our IAM user credentials. It's never a good practice to hard-code secret credentials directly in the code, so we will use  GitHub's secrets feature to store this information securely.
Go to the **Settings** tab in your GitHub repository and in the menu on the left choose **Secrets** and then **Actions**. To add a new secret click on the button **New repository secret** on the top right.
For our example you should add the following secrets:

* AWS_ID
* AWS_SECRET
* AWS_REGION

With the secrets set, paste the following content to your `aws_ci_cd.yml` file. We will go through each section in the following. Don't forget to replace `YOUR_DEPLOYMENT_APPLICATION_NAME` and `YOUR_DEPLOYMENT_GROUP_NAME` with your **CodeDeploy** information.

```yml
name: AWS CI/CD
on:
  push:
      branches:
        - master
        
jobs:
  deploy:
    name: Deploy to AWS EC2 instance
    runs-on: ubuntu-latest
    steps:
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v1
        with:
          aws-access-key-id: ${{ secrets.AWS_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET }}
          aws-region: ${{ secrets.AWS_REGION }}
      
      - name: Create CodeDeploy deployment
        id: deploy
        run: |
          aws deploy create-deployment \
            --application-name YOUR_DEPLOYMENT_APPLICATION_NAME \
            --deployment-group-name YOUR_DEPLOYMENT_GROUP_NAME \
            --deployment-config-name CodeDeployDefault.OneAtATime \
            --github-location repository=${{ github.repository }},commitId=${{ github.sha }}
```

The `name` section is just the name of the workflow, that will be shown on GitHub Actions dashboard. The `on` section describes what will trigger the workflow, in our case a **push** in the `master` branch.

The `jobs` sections describes the actions itself. In this example we defined only one job `deploy` as the build part is done directly in AWS. Under each job we must define its `name`, its `runs-on` and its `steps`. The `runs-on` section describes the environment in which the code defined in the step will be run, we will use a linux environment thanks to the `ubuntu-latest` value.

## Deploy job

The first step is to configure the AWS credentials, to do so we are going to use the action available on `aws-actions/configure-aws-credentials@v1`. To use this action we need to pass the ID and secret of our user and the AWS region we are using, which we defined in the secrets before.

Next, to execute the deployment, we are going to run a command passing our deployment parameters as well as our repository's name and the hash of the commit we want to use. The `application-name` and `deployment-group-name` are respectively the name of the application and the deployment group we created on **CodeDeploy**. By using the variables `github.repository`  and `github.sha` we have the current repository and the hash of the last commit. 
## Conclusion

Now that everything is set, once you push to your repository, the workflow will be triggered and it will be deployed to your EC2 instance on AWS. To access your app's default ports (HTTP, HTTPS), use the public address of your EC2 instance, which can be easily found in the instance's summary.
