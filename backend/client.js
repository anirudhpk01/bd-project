const {Kafka}= require("kafkajs")
exports.kafka= new Kafka({
    clientId: "bd-project",
    brokers: ["192.168.0.103:9092"],  //USE PRIVATE IP AND KAFKA PORT

})