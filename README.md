# todo
end to end encrypted todo app.

WARNING: This was created by a university student and is likely not secure. I created this to learn how to create secure systems, and to learn more about full stack development. If I was considering using this software, I would first check the code for exploits first before actual usage. I personally use this software in its current state, but I do not store important data using this. I also put the whole system behind a third password using apache's built in authentication, although this shouldn't be required. 

This application contains four parts.

* frontend: The react based website for this application.
* encryptedDataProvider: node.js/express based microservice that stores the encrypted data and a salt for the user
* authentication: node.js/express based microservice that issues JWTs based on passwords
* userInfo: node.js/express based microserver that stores other user information such as usernames and other data.

Each of the microservices has their own postgresql database that should be stored seperately from each other. This overall provides additional security for all user data. They also each have their own configuration file. The configuration file is expected to be in the same directory as the main.js file and is expected to be called `Settings.json`. Each microservice contains a example file called `ExSettings.json`. This file needs to be renamed and be configured for your setup. Information about the settings for each microservice is contained inside the README.md files for each microservice.

During testing, I just use one postgresql database for simplicity, but in production each of these microservices and their accompanying databases would preferably be on completely separate servers or at least isolated in separate VMs. This means a total of 6 servers/VMs. 

### Attack surface and consequences of exploitation.

All encryption is done locally on the user's device based on a second password (encryption password) that is not stored anywhere but on the user's device. The encryption password is combined with a salt from the encryptedDataProvider to derive a AES-256 key using PBKDF2-SHA512. This then encrypts the data and as long as a strong password is set, recovery of encrypted user data should be practically impossible. The user data is stored at rest on the user's device in this format so access to the user's device when not currently accessing the app would only allow access to encrypted data.

If a attacker exploits the authentication service database, emails, user ids, and bcrypt hashed passwords are obtained. A bruteforce could eventually allow raw passwords to be obtained but this would take a significant period of time, primarily due to the pepper included in the hashed passwords. In addition to the normal salt and password of a user being included in the bcrypt hash, a very long random string is included in the configuration file that is added to the hash called the pepper. The pepper would have to be bruteforced or found by finding a exploit that gives access to the configuration file before bruteforcing any passwords would be possible. If a very large pepper such as 128 characters or more is included, bruteforcing it should be practically impossible. If the pepper is found, the hashes should still be relatively secure relying on bcrypt. If a exploit is noticed, users could be required to verify their identity using their email upon their next login and then required to change their password. 

If access to the underlying server hosting the authentication service is obtained, either through a exploit in the service or through other means such as a comprimised user account with ssh access, the JWT private key could be obtained. This when combined with the user ids of all users which could be obtained from the database which credentials are stored in the configuration file, would allow generation of authentication tokens for all users. This would then allow all user data to be obtained from the other services. A ratelimit, especially with some kind of blocking for a IP that is accessing many accounts at once could slow or limit this type of attack but likely would not be able to permanently stop it. A ratelimit like this would also have to carefully chosen to not block users using VPNs and tor which could produce false positives. In addition to obtaining all user data stored for the app, a hashed copy of user's password with a weaker hashing function could be obtained using a man in the middle attack. The frontend hashes user's passwords with SHA-512 before being sent to the authentication service. This would make obtaining passwords slightly harder, but these passwords are hashed with a very fast hashing function with no salt. This means that for simple passwords rainbow tables could be used, and for more complex passwords they could be bruteforced quickly.

Another idea to check if a attack like this is in progress is checking the last login time against their JWT. If a user has not logged in in the past 30 days, but has a valid JWT, this is not possible and could force the application to shut its self down. If a attacker was careful they could likely modify the login times to prevent this shut down from occurring, but it would provide another layer of security.

If a attacker exploits the encryptedDataProvider service, random user ids and encrypted user data could be obtained. Theoretically these user ids should not be able to be traced back to other information about the user without exploiting another service, which should make targeted attacks against the encrypted data harder. This data could be bruteforced, but assuming a strong encryption password this should take a very long time.

If a attacker exploits the userInfo service, only a user's name, their user id, and other meta data about the user would be obtained. They would not get access to encrypted or hashed data about the user.

This overall means that even if a attacker exploits one service, they do not have all data about the user, and even if someone running the app wanted to use the data for something nefarious, they still don't have access to user data or passwords. 

This setup also relys on the underlying servers to be secure. If the server hosting one of the services is compromised, either through the service being exploited, or the server being accessed through other means such as a compromised user account with ssh access, full access to the database could be obtained in additional to any configuration data and other secrets such as the JWT private key. These situations would be equivelent to above scenarios as described.


