# [Form Submit][form submit] Action Alternative

# Introduction

In case you want to have your own Eloqua [Form Submit][form submit] hosted and controlled by you, just make a fork and follow the steps from Installation to add it to your portal.

This is an alternative to [Form Submit][form submit] and as an added feature - instead of displaying the names of the fields we display the
actual values making it more easy to the marketer to configure the forms in the configuration phase.

So... this application is an [AppCloud Action Service][1] which offers the possibility to the marketer to choose and configure a form with contact information.
These forms will be send via Email to the customers which are in the campaign.
The fields in a form can be predefined and taken from the contact info or can be static and enter manually by the marketer.  


## What is an Action Service?  


To be able to understand how and Action Service should be build you should have a look at this [image][2].

In a couple of words:

- All the logic of the application needs to be built in an external service with a couple of endpoints required by Eloqua.

    - **Create** - called when the Users adds the app on the UI

    - **Configure** - called when the User chooses to configure the app (in our case returns the view and handle its requests)

    - **Notify** - called when the campaign is running and it needs to handle the actions ( in our case to send the emails with the selected form to the users in the campaign)

    - **Delete** - called when the Users delete the app from the UI  

- The authentication to the API is done using Basic auth or oAuth 2.0.


# Installation

- **Step 0**: Pull the sources from git to `/eloquaapp` and get the node references using `npm install`

#### In case you what to use Docker follow the next steps:

- **Step 1**: Go to you deployment server and make sure you have docker and docker compose installed

- **Step 2**: Add the company name, user and password in the `./docker/docker-compose.yml` file.

- **Step 3**: Open a terminal and change directory to `/eloquaapp`

- **Step 4**: RUN ```docker build -t your-user/node-app```

- **Step 5**: RUN ```cd docker```

- **Step 6**: RUN ```docker-compose up```  


#### In case you will not use Docker:

- **Step 1**: Go to you deployment server and install mongo just by running the instructions from ./docker/mongodocker/Dockerfile or
follow the instructions from [mongo website][mongo website]

- **Step 2**: open a terminal and change directory to `/eloquaapp`

- **Step 3**: RUN ```npm start site username password```
or

- **Step 4**: RUN ```forever start --minUptime 1000 --spinSleepTime 1000 ./bin/www site username password```


#### Publish, Register and Test

- Publish the service with Create, Configure and Delete API paths in an accessible location.

- You can make the services available via HTTPS using a proper certificates by adding
certificate.crt and private.key in the ssl folder.  

- Now go to your Eloqua portal and [Register the Eloqua app][6].
There you have to set the Create, Configure and Delete URLs and a lot more info.

- Create a test campaign and a test form in Eloqua.

- To test it add the Action service to the campaign and with it a Segmented element
witch will provide the test users to the campaign. To see that the Action Service sends the
 e-mails add a wait action at the end of your campaign. Configure the app and start the campaign.

 (You should have an already created form and the form configured to send the email to you to be
 able to see the Action Service emails.)

This is how a simple campaign should look like:

![create campaign][campaign]

And here is a configuration form:

![set form][config image]



# Implementation details

The Eloqua App connects to an external service hosted in Azure.
In our case the external service is built using Node JS and [Express 4.x][5].
For Each endpoint required by Eloqua we are building a different route in Express. The routes can be found in
the './routes/' folder.

To be able to offer the marketer the possibility to configure the form fields in Eloqua we built a view './views/configure.jade' using
[Jade][7] template language.
All the predefined fields can be sent to Eloqua using their API. The API has a base URL which
sometimes changes, because of that we are asking Eloqua every time for the base URL.

The static fields need to be persisted on the server because Eloqua is not offering the
possibility to store other fields then the Eloqua fields in a form.

To be able to store the token, refresh token and the static fields for an app instance we used [MongoDB][3].
To handle the DB communication we are using [Mongoose JS][4].

To keep the service always running we are starting it using [forever][8].



[1]:https://docs.oracle.com/cloud/latest/marketingcs_gs/OMCAB/#Developers/AppCloud/Develop/develop-action-service.htm%3FTocPath%3DAppCloud%2520Development%2520Framework%7CDevelop%2520Apps%7C_____3
[2 1]:https://docs.oracle.com/cloud/latest/marketingcs_gs/OMCAB/Content/Resources/Images/flow-diagrams/Action-flow.png
[2]:http://docs.oracle.com/cloud/latest/marketingcs_gs/OMCAB/Resources/Images/AppCloud/flow-diagrams/Action-flow.png
[3]:https://www.mongodb.org/
[4]:http://mongoosejs.com/
[5]:http://expressjs.com/
[6 1]:https://docs.oracle.com/cloud/latest/marketingcs_gs/OMCBA/#C_Register/register-action.htm%3FTocPath%3DRegister%2520Your%2520App%7C_____1
[6]:https://docs.oracle.com/cloud/latest/marketingcs_gs/OMCAB/#Developers/AppCloud/Register/register-app-and-services.htm%3FTocPath%3DAppCloud%2520Development%2520Framework%7CRegister%2520Your%2520App%7C_____0
[7]:http://jade-lang.com/
[8]:https://github.com/foreverjs/forever
[mongo website]: https://docs.mongodb.com/manual/installation/#installing-mongodb
[form submit]:https://cloud.oracle.com/marketplace/en_US/listing/2955671?_afrLoop=9247451822652244&_afrWindowMode=0&_afrWindowId=null
[config image]:/app_images/config.png
[campaign]:/app_images/campaign.png
