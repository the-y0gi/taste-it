const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menu.controller');
const { uploadSingleImage } = require('../../../shared/utils/multer');
const protectSuperAdmin = require('../../../shared/middleware/protectSuperAdmin');
const protectAdminOrBranch = require('../../../shared/middleware/protectAdminOrBranch');

// Image Upload with size limit (Super Admin or Branch Manager)
router.post('/upload', protectAdminOrBranch, uploadSingleImage('image'), menuController.uploadImage);

// Delete Image from Cloudinary
router.post('/upload/delete', protectAdminOrBranch, menuController.deleteImage);

// Public POS & Customer feed
router.get('/pos-feed', menuController.getPOSMenu);

// Category Routes
router.get('/categories', menuController.getCategories);
router.post('/categories', protectAdminOrBranch, menuController.createCategory);
router.put('/categories/:id', protectAdminOrBranch, menuController.updateCategory);
router.delete('/categories/:id', protectAdminOrBranch, menuController.deleteCategory);

// Modifier Group Routes
router.get('/modifiers', menuController.getModifierGroups);
router.post('/modifiers', protectAdminOrBranch, menuController.createModifierGroup);
router.put('/modifiers/:id', protectAdminOrBranch, menuController.updateModifierGroup);
router.delete('/modifiers/:id', protectAdminOrBranch, menuController.deleteModifierGroup);

// Product Routes
router.get('/products/branch-list', menuController.getBranchProductsList);
router.patch('/products/:id/toggle-active', protectAdminOrBranch, menuController.toggleProductActive);
router.patch('/products/:id/toggle-stock', protectAdminOrBranch, menuController.toggleProductStock);
router.patch('/products/:id/toggle-branch', protectAdminOrBranch, menuController.toggleProductBranch);
router.patch('/categories/:id/toggle-branch', protectAdminOrBranch, menuController.toggleCategoryBranch);
router.get('/products', menuController.getProducts);
router.post('/products', protectAdminOrBranch, menuController.createProduct);
router.put('/products/:id', protectAdminOrBranch, menuController.updateProduct);
router.delete('/products/:id', protectAdminOrBranch, menuController.deleteProduct);

//Deal of the Day Routes
router.get('/deals-of-the-day', menuController.getDealsOfTheDay);
router.post('/deals-of-the-day', protectSuperAdmin, menuController.createDealOfTheDay);
router.put('/deals-of-the-day/:id', protectSuperAdmin, menuController.updateDealOfTheDay);
router.delete('/deals-of-the-day/:id', protectSuperAdmin, menuController.deleteDealOfTheDay);

module.exports = router;
