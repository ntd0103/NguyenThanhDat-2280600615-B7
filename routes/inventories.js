var express = require('express');
var router = express.Router();
let mongoose = require('mongoose');
let inventoryModel = require('../schemas/inventories');
let productModel = require('../schemas/products');

function isValidQuantity(quantity) {
  return Number.isFinite(quantity) && quantity > 0;
}

router.get('/', async function (req, res, next) {
  let result = await inventoryModel.find().populate('product');
  res.send(result);
});

router.get('/:id', async function (req, res, next) {
  try {
    let id = req.params.id;
    let result = await inventoryModel.findById(id).populate('product');
    if (!result) {
      return res.status(404).send({
        message: 'ID NOT FOUND'
      });
    }
    res.send(result);
  } catch (error) {
    res.status(404).send({
      message: 'ID NOT FOUND'
    });
  }
});

router.post('/add_stock', async function (req, res, next) {
  try {
    let product = req.body.product;
    let quantity = Number(req.body.quantity);

    if (!mongoose.Types.ObjectId.isValid(product) || !isValidQuantity(quantity)) {
      return res.status(400).send({
        message: 'Invalid product or quantity'
      });
    }

    let existingProduct = await productModel.findOne({ _id: product, isDeleted: false });
    if (!existingProduct) {
      return res.status(404).send({
        message: 'PRODUCT NOT FOUND'
      });
    }

    let result = await inventoryModel.findOneAndUpdate(
      { product: product },
      { $inc: { stock: quantity } },
      { new: true }
    ).populate('product');

    if (!result) {
      return res.status(404).send({
        message: 'INVENTORY NOT FOUND'
      });
    }

    res.send(result);
  } catch (error) {
    res.status(500).send({
      message: error.message
    });
  }
});

router.post('/remove_stock', async function (req, res, next) {
  try {
    let product = req.body.product;
    let quantity = Number(req.body.quantity);

    if (!mongoose.Types.ObjectId.isValid(product) || !isValidQuantity(quantity)) {
      return res.status(400).send({
        message: 'Invalid product or quantity'
      });
    }

    let result = await inventoryModel.findOneAndUpdate(
      {
        product: product,
        stock: { $gte: quantity }
      },
      { $inc: { stock: -quantity } },
      { new: true }
    ).populate('product');

    if (!result) {
      return res.status(400).send({
        message: 'NOT ENOUGH STOCK OR INVENTORY NOT FOUND'
      });
    }

    res.send(result);
  } catch (error) {
    res.status(500).send({
      message: error.message
    });
  }
});

router.post('/reservation', async function (req, res, next) {
  try {
    let product = req.body.product;
    let quantity = Number(req.body.quantity);

    if (!mongoose.Types.ObjectId.isValid(product) || !isValidQuantity(quantity)) {
      return res.status(400).send({
        message: 'Invalid product or quantity'
      });
    }

    let result = await inventoryModel.findOneAndUpdate(
      {
        product: product,
        stock: { $gte: quantity }
      },
      { $inc: { stock: -quantity, reserved: quantity } },
      { new: true }
    ).populate('product');

    if (!result) {
      return res.status(400).send({
        message: 'NOT ENOUGH STOCK OR INVENTORY NOT FOUND'
      });
    }

    res.send(result);
  } catch (error) {
    res.status(500).send({
      message: error.message
    });
  }
});

router.post('/sold', async function (req, res, next) {
  try {
    let product = req.body.product;
    let quantity = Number(req.body.quantity);

    if (!mongoose.Types.ObjectId.isValid(product) || !isValidQuantity(quantity)) {
      return res.status(400).send({
        message: 'Invalid product or quantity'
      });
    }

    let result = await inventoryModel.findOneAndUpdate(
      {
        product: product,
        reserved: { $gte: quantity }
      },
      { $inc: { reserved: -quantity, soldCount: quantity } },
      { new: true }
    ).populate('product');

    if (!result) {
      return res.status(400).send({
        message: 'NOT ENOUGH RESERVED OR INVENTORY NOT FOUND'
      });
    }

    res.send(result);
  } catch (error) {
    res.status(500).send({
      message: error.message
    });
  }
});

module.exports = router;
