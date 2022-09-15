# Fly.io deployment

> Fly.io is a relatively new cloud platform launched in 2017 and aiming to run apps and databases close to the users.

## Deployment process

The platform is most controlled through it command line tool, `flyctl`, which is very interactive and easy to use. In terms of process to deploy an application, Fly.io compares to Heroku, with a simple and straightforward deployment process by sacrificing some advanced functionalities available in other cloud platforms, such as Amazon AWS and Microsoft Azure. Moreover, the platform has a good documentation for quick starting that can be found [here](https://fly.io/docs/hands-on/).

Installing `flyctl` is really simple:
```bash
# macOS
brew install flyctl
# Or
curl -L https://fly.io/install.sh | sh

# Linux
curl -L https://fly.io/install.sh | sh

# Windows (in Powershell)
iwr https://fly.io/install.ps1 -useb | iex
```

After installing `flyctl`, the first step to start using its services is to create an account. You can do so by running the command `flyctl auth signup` where you can use your GitHub account or an email to sign up. Fly.io offers free allowances but in order to use them you will need to enter your credit card information, which is pretty standard across cloud platforms. You can check Fly.io pricings [here](https://fly.io/docs/about/pricing).

To sign in to your account use the command `flyctl auth login`.