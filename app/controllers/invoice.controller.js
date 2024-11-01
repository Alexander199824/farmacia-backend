const db = require('../config/db.config');
const Invoice = db.Invoice;
const InvoiceItem = db.InvoiceItem;

// Crear una nueva factura
exports.createInvoice = async (req, res) => {
  const { clientId, sellerDPI, clientDPI, paymentMethod, items } = req.body;

  try {
    if (!items || items.length === 0) {
      return res.status(400).json({ message: "La lista de artículos no puede estar vacía" });
    }

    // Validar que cada item tenga productId y unitPrice
    for (const item of items) {
      if (!item.productId || !item.unitPrice) {
        return res.status(400).json({ message: "Cada artículo debe tener 'productId' y 'unitPrice'" });
      }
    }

    // Calcular el totalAmount
    const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

    // Crear la factura con los datos básicos
    const invoice = await Invoice.create(
      {
        clientId,
        sellerDPI,
        clientDPI,
        totalAmount,
        paymentMethod,
        date: new Date()
      },
      { include: [{ model: InvoiceItem, as: 'items' }] }
    );

    // Crear los items de la factura
    for (const item of items) {
      await InvoiceItem.create({
        invoiceId: invoice.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.quantity * item.unitPrice,
      });
    }

    res.status(201).json({ message: "Factura creada con éxito", invoice });
  } catch (error) {
    console.error("Error al crear factura:", error);
    res.status(500).json({ message: "Error al crear factura", error: error.message });
  }
};

// Obtener todas las facturas
exports.getAllInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.findAll({
      include: [{ model: InvoiceItem, as: 'items' }]
    });
    res.status(200).json(invoices);
  } catch (error) {
    console.error("Error al obtener facturas:", error);
    res.status(500).json({ message: "Error al obtener facturas", error: error.message });
  }
};

// Obtener una factura por ID
exports.getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id, {
      include: [{ model: InvoiceItem, as: 'items' }]
    });
    if (invoice) res.status(200).json(invoice);
    else res.status(404).json({ message: "Factura no encontrada" });
  } catch (error) {
    console.error("Error al obtener factura:", error);
    res.status(500).json({ message: "Error al obtener factura", error: error.message });
  }
};

// Actualizar una factura
exports.updateInvoice = async (req, res) => {
  const { clientId, sellerDPI, clientDPI, paymentMethod, items } = req.body;

  try {
    const invoice = await Invoice.findByPk(req.params.id);
    if (!invoice) return res.status(404).json({ message: "Factura no encontrada" });

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "La lista de artículos no puede estar vacía" });
    }

    for (const item of items) {
      if (!item.productId || !item.unitPrice) {
        return res.status(400).json({ message: "Cada artículo debe tener 'productId' y 'unitPrice'" });
      }
    }

    const totalAmount = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

    await invoice.update({
      clientId,
      sellerDPI,
      clientDPI,
      totalAmount,
      paymentMethod
    });

    // Eliminar los items existentes y agregar los nuevos
    await InvoiceItem.destroy({ where: { invoiceId: invoice.id } });
    for (const item of items) {
      await InvoiceItem.create({
        invoiceId: invoice.id,
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.quantity * item.unitPrice,
      });
    }

    res.status(200).json({ message: "Factura actualizada con éxito", invoice });
  } catch (error) {
    console.error("Error al actualizar factura:", error);
    res.status(500).json({ message: "Error al actualizar factura", error: error.message });
  }
};

// Eliminar una factura
exports.deleteInvoice = async (req, res) => {
  try {
    const invoice = await Invoice.findByPk(req.params.id);
    if (!invoice) return res.status(404).json({ message: "Factura no encontrada" });

    await InvoiceItem.destroy({ where: { invoiceId: invoice.id } });
    await invoice.destroy();
    
    res.status(200).json({ message: "Factura eliminada con éxito" });
  } catch (error) {
    console.error("Error al eliminar factura:", error);
    res.status(500).json({ message: "Error al eliminar factura", error: error.message });
  }
};

// Obtener el próximo número de factura
exports.getNextInvoiceNumber = async (req, res) => {
  try {
    console.log("Fetching last invoice to determine next invoice number.");
    const lastInvoice = await Invoice.findOne({ order: [['id', 'DESC']] });
    
    const nextInvoiceNumber = lastInvoice ? lastInvoice.id + 1 : 1;
    
    res.status(200).json({ nextInvoiceNumber });
    console.log("Next invoice number:", nextInvoiceNumber);
  } catch (error) {
    console.error("Error al obtener el número de factura:", error.message);
    res.status(500).json({ message: "Error al obtener el número de factura", error: error.message });
  }
};
