const orderRoutes = require('./routes/order.routes');
const tableRoutes = require('./routes/table.routes');

exports.initOrderModule = (app) => {
  app.use('/api/orders', orderRoutes);
  app.use('/api/tables', tableRoutes);
};
