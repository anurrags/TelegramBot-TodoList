const TelegramBot = require("node-telegram-bot-api");
require("dotenv").config();
const mongoose = require("mongoose");

mongoose.set("strictQuery", false);
const uri = process.env.MONGOD;

const todoSchema = new mongoose.Schema({
  text: String,
  chatId: String,
});

const Todo = mongoose.model("Todo", todoSchema);

mongoose
  .connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error(err));

const bot = new TelegramBot(process.env.BOT_TOKEN, {
  polling: true,
});

async function handleCommand(command, chatId, text) {
  if (command === "/add") {
    // Add a new todo item
    const todo = new Todo({ text: text, chatId: chatId });
    await todo.save();
    bot.sendMessage(chatId, "Todo item added");
  } else if (command === "/list") {
    // Get the list of todo items for the chat
    const cursor = Todo.find({ chatId: chatId }).cursor();

    const todos = [];
    // cursor.forEach(function (docs) {
    //   console.log(docs.text);
    // });
    await cursor.forEach((doc) => {
      todos.push(doc.text);
    });
    bot.sendMessage(chatId, `Todo list:\n${todos.map((t) => t).join("\n")}`);
  } else if (command === "/remove") {
    // Remove a todo item
    await Todo.deleteOne({ text: text, chatId: chatId });
    bot.sendMessage(chatId, "Todo item removed");
  }
}

bot.on("message", (msg) => {
  const chatId = msg.chat.id;
  const message = msg.text;

  // Check if the message is a command
  if (message.startsWith("/")) {
    // Split the message into the command and the text of the todo item
    const parts = message.split(" ");
    const command = parts[0];
    const text = parts.slice(1).join(" ");
    // Handle the command
    handleCommand(command, chatId, text);
  }
});
