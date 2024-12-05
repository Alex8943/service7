import { connect } from "amqplib";

let channel: any;

// Function to create or reuse a RabbitMQ channel
export async function createChannel() {
    if (channel) return channel;

    const connection = await connect("amqp://localhost"); // Adjust URL if needed
    channel = await connection.createChannel();
    return channel;
}

// Function to publish messages to a RabbitMQ queue
export async function publishToQueue(queueName: string, message: any) {
    const channel = await createChannel();
    await channel.assertQueue(queueName, { durable: false });
    channel.sendToQueue(queueName, Buffer.from(JSON.stringify(message)));
    console.log(`Message sent to queue ${queueName}:`, message);
}
