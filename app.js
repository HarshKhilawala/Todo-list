const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const mongoose = require("mongoose");
const _ = require("lodash");


app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://admin-harsh:root@cluster0.zjmcs.mongodb.net/todolistDB", {useNewUrlParser:true, useUnifiedTopology: true });

const itemsSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true,"Please enter the name."]
  }
});

const Item = mongoose.model("Item", itemsSchema);

const pen = new Item ({
  name: "Pen"
});

const pencil = new Item ({
  name: "Pencil"
});

const rubber = new Item ({
  name: "Rubber"
});

const defaultItems = [pen, pencil, rubber];

const listSchema = new mongoose.Schema ({
  name: String,
  items: [itemsSchema]
});

const List = mongoose.model("List", listSchema);


app.get("/", function(req, res) {
  Item.find({}, function(err,foundItems){
    if (err) {
      console.log(err);
    } else {
      if (foundItems.length === 0) {
        Item.insertMany(defaultItems, function(err){
          if (err) {
            console.log(err);
          } else {
            console.log("Successfully added the items.");
          }
        });
        res.redirect("/");
      } else {
        res.render("list", {listTitle: "Today", newListItems: foundItems});
      }
    }
  });

});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  const newItem = new Item ({
    name: itemName
  });

  if (listName === "Today") {
    newItem.save();
    res.redirect("/");
  } else {
    List.findOne({name:listName}, function(err, listFound){
      if (!err) {
        listFound.items.push(newItem);
        listFound.save();
        res.redirect("/"+listName);
      }
    });
  }

});

app.post("/delete", function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName==="Today") {
    Item.findByIdAndDelete(checkedItemId,function(err){
      if (err) {
        console.log(err);
      } else {
        console.log("Successfully Deleted the document.");
      }
    });
    res.redirect("/");

  } else {
    List.findOneAndUpdate({name:listName},{$pull: {items: {_id:checkedItemId }}}, function (err, listFound) {
      if (!err) {
        res.redirect("/"+listName);
      }
    });
  }

});

app.get("/:customListName", function(req,res){
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({name:customListName}, function(err, listFound){
      if (!err) {
        if(!listFound) {
          // Creating a new list
          const list = new List({
            name: customListName,
            items: defaultItems
          });
          list.save();
          res.redirect("/"+customListName);

        } else {
          // Show existing list
          res.render("list", {listTitle: listFound.name ,newListItems: listFound.items});
        }
      }
  });
});

app.get("/about", function(req, res){
  res.render("about");
});








let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server has started Successfully on port "+ port);
});
