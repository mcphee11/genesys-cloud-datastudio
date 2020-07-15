# genesys-cloud-datastudio
Google DataStudio connector to Genesys Cloud Example

To get started with this project you will need to create a project in Google Apps Script: https://script.google.com or if you wish you can use "clasp" to clone this to your Apps Script projects. Clasp is not a requirement for this project, but if your currently using it you know what to do.

If your NOT using clasp you will need to copy the code from the "code.js" file to your "Code.gs" in your project and the same for "appsscript.json"

![](/docs/images/screenShot1.png?raw=true)

Once you have this inside your Apps Script project you will need to save and then you can test it directly from the "Publish" -> "Deploy from manifest..."

![](/docs/images/screenShot2.png?raw=true)

This will then bring up a window where you can directly click on the linnk to load the latest build of the project. For additonal deployment options please go through the Google Apps Script documentation.

![](/docs/images/screenShot3.png?raw=true)

You will be prompted to Authorize the connector (This is a 3rd party connector do at your own risk). Once allowed you will see the configuration screen of the connector that requires inputs from you to connect to your Genesys Cloud ORG. You will need to have a "client_credentials" account configured in your ORG so you can have the clientId & secret. This conenction will need to that the "Roles" required to conenct to the API your planning to use for example "analytics".

![](/docs/images/screenShot4.png?raw=true)

Once you click connect you will then be presented with the default types that have been generated by the conenctor youd can change these types if required. From here the data is able to be used and built out into DataStudio models as you normally would do.

![](/docs/images/screenShot5.png?raw=true)