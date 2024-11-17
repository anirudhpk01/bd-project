
# RR-Team-28-emostream-concurrent-emoji-broadcast-over-event-driven-architecture
=======
# BD Project: Emoji-streaming


# Read Me update on how to set it up and how it works!

## Screenshots


![image](https://github.com/user-attachments/assets/536cda04-6318-4013-9a82-3be42e638f34)

![image](https://github.com/user-attachments/assets/7b806a6f-fa99-4cc1-8190-449b27fc6ff5)
![image](https://github.com/user-attachments/assets/9b0e24b2-d564-48c6-b83b-f7a288c0c347)




## Processes

### client.js : Sets up the kafka client that gets associated with the broker and the broker config ,which can be used by producers and consumers

### index.js : Run this to create a new topic

### scaletest.js: Currently for demonstration purposes, runs a script that generates 300 happy emojis and 200 sad emojis to a kafka topic ,in message queues of 500ms , also exposes a post endpoint where users can generate their own emoji data! (runs on port 3000)

### test1.py : in the sparkstreamlogic directory, this is our main spark structured streaming process, ingests data from the kafka topic , processes it in batches of 2000ms , and writes this to a new kafka topic

### publisher.js: this is the main publisher, the first receiver of the processed spark data! acts as a forwarding medium, forwards message to another kafka topic that subscriber clusters can read from (runs on port 3001)

### sktcluster2.js: this is one of the subcribing clusters, receives data and sets it up that registered users can access emoji stream through socket connections. Connection to cluster is made by a dynamic allocation code that checks capacity of the cluster and decides.More on this later on in the README! (this process runs on port 3005)

### sktcluster4.js: same as sktcluster2.js. (runs on  port 3011)

### sktcluster3.js: same as the previous clusters. (runs on port 3006)

## Storage and Access

We have a robust serverless postgres instance running on NeonTech, that has the registered users data along with their Tier information that is checked before giving access to emojistream. We also have clusterinfo with a capacity field. Everytime there is a new connection, only a capable cluster is picked for socket connection to enable emojistreaming
So we're doing 

### Tier Checking
### Capacity Checking
### Registration
### Auth
### Upload of emojis

## TIER Info

### Tier 1 : Upto 5 connected devices (tabs)
### Tier 2: Upto 2 connected devices (tabs)
### Tier 3: Upto 1 connected device (tab)

## How to get it running!

 1. Have Kafka and Spark installed, for extra surity have Findspark installed as well through a pip install

 2. Make sure zookeeper is running, and the Kafka Broker is running on port 9092 (if its another port ,configure the same in index.js)

3. Clone this repo!

 4. cd to producerlogic and do `npm i`

 5. You will need the .env credentials to connect to NeonTech, Star this repo and ask anirudhpk01 for the credentials!

6. If you've installed kafka through a script, cd to `/usr/local/kafka` and run  `bin/kafka-topics.sh --bootstrap-server localhost:9092 --list`  to see which are the topics currently set up. You'll need to run this every time you gotta check the topics available

7. Now go to index.js and change the topic name to `emoji` , run `node index.js`, change it to `emoji-counts` , run it again, again to `publisher-emojis` , run it again. This creates all the topics that our processes read from and write to 

8. Run `node scaletest.js` , CLI should show a bunch of messages continually being generated. If so, its working fine

9. cd to sparkstreamlogic and run `python3 test1.py` (or python) , make sure to configure your versions of kafka and spark in this one, and deal with findspark as you wish. If it shows an offset error, Ctrl+c and run it again, it should work! (we are storing offsets in the topics where structured streaming writes to in a checkpoints folder, and this changes everytime you recreate the topic) , if its working, you will see a bunch of `WARN HDFS..` after which a `WARN AdminClientConfig`... and then all the `WARN ProcessingTimExecutor` messages afte each stage, are the emoji data actually being processed and written. We get this warning cos sometimes there is a sync issue in reading the data, so mild differences from the 2000ms batch processing time occurs.

10. cd to producerlogic, run `node publisher.js`, if it shows an error timestamp, Ctrl+c run again! and wait...you should soon see continous influx of processed emoji data in the terminal. This data gets forwarded to publisher-emojis topic 

 11. Run `node sktcluster2.js`, and the other clusters to set up the cluster servers...you can create your own too! just copy the code in sktcluster2.js, paste it into your new cluster, change `PORT` and `currentPort` variables in the code to whichever new available port you wanna run your server on.All set!

12. Now for the final part, open Postman, send a POST request to the `/register` request to any of the server's register endpoint! make sure to have a name, tier and password configured in the body of the request (Screenshot below)... we'll work on a frontend soon!
![image](https://github.com/user-attachments/assets/4171cd2c-e5d4-49d6-a309-ab5b0d80ca4c)

13. After succesful registration, just open `index2.html` , rejoice at the crisp frontend, type in your details you registered with, and watch as you get redirected to an available cluster dynamically and view your emoji-stream LIVE as it updates!!

If you wish to integrate our LIVE emoji-stream over YOUR event-driven architecture, Contact us!!

# And there you go! post emojis or view the script's scale down algorithm reduce 400+ emojis to just 4/5 in real time! and of course, all of it in Real Time!!










