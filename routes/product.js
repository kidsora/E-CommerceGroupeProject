
const express = require('express')
const router = express.Router()
const Product = require('../models/Product')  
const multer = require('multer');

router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;
    const searchRegex = new RegExp(query, 'i');
    const products = await Product.find({ 
      $or: [{ name: searchRegex }, { description: searchRegex }] 
    });
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/filter', async (req, res) => {
  try {
    const { rating, brand } = req.query;
    let query = {};

    if (rating) {
      query.rating = { $gte: Number(rating) };
    }
    if (brand) {
      query.brand = brand;
    }

    const products = await Product.find(query);
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/getproduct', async (req, res) => { 
   
    try {
        const { name, category, minPrice, maxPrice, page = 1, limit = 10 } = req.query;
        let query = {};

        if (name) {
            query.name = new RegExp (name, 'i');
        }
        if (category) {
            query.category = category;
        }
        if (minPrice) {
            query.price = { ...query.price, $gte:Number(minPrice)  };

        }
        if (maxPrice) {
            query.price = { ...query.price, $lte:Number(maxPrice) };
        }
      //   if (instock) {
      //     query.instock = instock === 'true';
      // }
      if (Object.keys(query).length === 0) {
        const products = await Product.find();
        return res.json(products);
    }

        const products = await Product.find(query)
        .skip((page-1)*limit)
        .limit(Number(limit))
        const total = await Product.countDocuments(query);
        res.json(products);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});


router.put('/updateproduct/:id', async (req, res) => {
  try {
      const { id } = req.params
      const updatedProductDetails = req.body 

      const updatedProduct = await Product.findByIdAndUpdate(id, updatedProductDetails, { new: true })

      if (!updatedProduct) {
          return res.status(404).json({ message: 'Product not found' })
      }

      res.json(updatedProduct)
  } catch (err) {
      res.status(500).json({ message: err.message })
  }
});


router.post('/product/:id/review', async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const product = await Product.findById(req.params.id);

    if (product) {
      const review = {
        user: req.user._id,
        rating: Number(rating),
        comment,
      };

      product.reviews.push(review);
      product.numReviews = product.reviews.length;
      product.rating =
        product.reviews.reduce((acc, item) => item.rating + acc, 0) /
        product.reviews.length;

      await product.save();
      res.status(201).json({ message: 'Review added' });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
 

router.post('/postproduct', async (req, res) => 
    { try { const product = new Product(req.body);
         await product.save(); res.status(201).send(product); }
          catch (error) { res.status(400).send(error); } });

          const storage = multer.diskStorage({
            destination: (req, file, cb) => {
              cb(null, 'uploads/'); 
            },
            filename: (req, file, cb) => {
              cb(null, Date.now() + '-' + file.originalname);
            }
          });
          const upload = multer({ storage: storage });
          router.put('/:id', upload.single('image'), async (req, res) => {
            try {
              const updatedData = {
                name: req.body.name,
                description: req.body.description,
                price: req.body.price,
                stock: req.body.stock,
                image: req.file ? req.file.path : req.body.image,
                category: req.body.category,
              };
              const updatedProduct = await Product.findByIdAndUpdate(req.params.id, updatedData, { new: true });
              if (!updatedProduct) {
                return res.status(404).json({ error: 'Product not found' });
              }
          
              res.status(200).json(updatedProduct);
            } catch (err) {
              console.error(err); 
              res.status(400).json({ error: err.message });
            }
          });
          
        

          router.delete('/product/:id', async (req, res) => {
            try {
              const prod = await Product.findByIdAndDelete(req.params.id);
              if (!prod) {
                return res.status(404).send();
              }
              res.status(200).json({"Message":"Product deleted"});
            } catch (error) {
              res.status(500).send(error.message);
            }
          });
          
          
          
          
          
          
  
                  


module.exports = router//Export the Router: