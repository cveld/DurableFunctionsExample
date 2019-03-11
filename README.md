# Durable Functions Example
This repo provides the demo code that accompanies the talk we gave at Future Tech 2019, Utrecht, The Netherlands.

# Full-fledged single page application
The demo entails a full-fledged responsive web app that integrates with an Azure (Durable) Functions back-end:
* Azure Active Directory Authentication
* WebSockets with Azure SignalR Service
* Angular
* Responsive web design
* Google Material

# Demo: Cancellable long-running workflow
![image](https://user-images.githubusercontent.com/6196260/54161318-16151c00-4452-11e9-812f-86a627e927fa.png)

# Demo: Monitoring of a Flights Data API
![image](https://user-images.githubusercontent.com/6196260/54161338-23320b00-4452-11e9-89dd-9c4fdcbdad67.png)

# Demo: Cloud-scale fractal processor
![image](https://user-images.githubusercontent.com/6196260/54161349-2927ec00-4452-11e9-8bc7-f787039e1ef5.png)

# References
https://docs.microsoft.com/azure/azure-functions/durable/durable-functions-overview
Jeff Hollan @ .NET Conf 2018 https://channel9.msdn.com/Events/dotnetConf/2018/S204

# Security
A note on security: in the demo's current version the durable function secret code is shared with the single page application. This is generally not a good idea as the secret code grants access to all durable functions. This design needs to be revisited and only the orchestrator id or a derivate should be shared.
