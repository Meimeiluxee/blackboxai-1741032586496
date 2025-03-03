const PDFDocument = require('pdfkit');

class PDFService {
  static async generateQuotePDF(quote) {
    return new Promise((resolve, reject) => {
      try {
        // Créer un nouveau document PDF
        const doc = new PDFDocument({
          size: 'A4',
          margin: 50
        });

        // Tableau pour stocker les chunks du PDF
        const chunks = [];
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));

        // En-tête
        doc.fontSize(20)
           .text('DEVIS', { align: 'center' })
           .moveDown();

        // Informations du devis
        doc.fontSize(12)
           .text(`Référence: ${quote.reference}`)
           .text(`Date: ${new Date(quote.createdAt).toLocaleDateString('fr-FR')}`)
           .text(`Date de validité: ${new Date(quote.dateValidite).toLocaleDateString('fr-FR')}`)
           .moveDown();

        // Informations client
        doc.fontSize(14)
           .text('Client:', { underline: true })
           .fontSize(12)
           .text(quote.Client.nom)
           .text(quote.Client.societe || '')
           .text(quote.Client.adresse)
           .text(`Tél: ${quote.Client.telephone}`)
           .text(`Email: ${quote.Client.email}`)
           .moveDown();

        // Description du projet
        doc.fontSize(14)
           .text('Description du projet:', { underline: true })
           .fontSize(12)
           .text(quote.description)
           .moveDown();

        // Tableau des prestations
        doc.fontSize(14)
           .text('Détail des prestations:', { underline: true })
           .moveDown();

        // En-têtes du tableau
        const tableTop = doc.y;
        doc.fontSize(12)
           .text('Description', 50, tableTop)
           .text('Réf.', 250, tableTop)
           .text('Quantité', 300, tableTop)
           .text('Prix unitaire HT', 400, tableTop)
           .text('Total HT', 500, tableTop)
           .moveDown();

        // Lignes du tableau
        let y = doc.y;
        quote.items.forEach(item => {
          const total = item.quantite * item.prixUnitaireHT;
          
          // Ajouter la description avec une indentation si c'est un service du catalogue
          doc.text(item.description, 50, y)
             .text(item.serviceId ? '(Catalogue)' : '', 250, y)
             .text(item.quantite.toString(), 300, y)
             .text(`${item.prixUnitaireHT.toFixed(2)} €`, 400, y)
             .text(`${total.toFixed(2)} €`, 500, y);
          
          y += 20;
        });

        doc.moveDown()
           .moveDown();

        // Totaux
        const totalsX = 400;
        doc.text(`Total HT: ${quote.totalHT.toFixed(2)} €`, totalsX, doc.y)
           .text(`TVA (${quote.tva}%): ${(quote.totalTTC - quote.totalHT).toFixed(2)} €`, totalsX, doc.y + 20)
           .text(`Total TTC: ${quote.totalTTC.toFixed(2)} €`, totalsX, doc.y + 40)
           .moveDown()
           .moveDown();

        // Options/Suppléments si présents
        if (quote.options && quote.options.length > 0) {
          doc.fontSize(14)
             .text('Options / Suppléments:', { underline: true })
             .fontSize(12);
          
          quote.options.forEach(option => {
            doc.text(`- ${option.description}: ${option.prix.toFixed(2)} € HT`);
          });
          
          doc.moveDown();
        }

        // Conditions de paiement
        if (quote.conditions) {
          doc.fontSize(14)
             .text('Conditions de paiement:', { underline: true })
             .fontSize(12)
             .text(quote.conditions)
             .moveDown();
        }

        // Pied de page
        doc.fontSize(10)
           .text("Ce devis est valable pour la durée spécifiée à compter de sa date d'émission.", {
             align: 'center'
           });

        // Finaliser le document
        doc.end();

      } catch (error) {
        reject(error);
      }
    });
  }
}

module.exports = PDFService;
