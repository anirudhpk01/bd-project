const {Kafka}= require("kafkajs")
exports.kafka= new Kafka({
    clientId: "bd-project",
    brokers: ["0.0.0.0:9092"],  //USE PRIVATE IP AND KAFKA PORT

})