import jsPDF from 'jspdf';

// Utility function to format amount values
export const formatAmount = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined) return '0.00';
  const numericValue = typeof value === 'string' ? parseFloat(value) : value;
  return isNaN(numericValue) ? '0.00' : numericValue.toFixed(2);
};

// Interface for PDF data
export interface PdfDocumentData { 
  title: string;
  referenceNumber: string;
  details: { label: string; value: string | number }[];
}

// Main function to create a modern PDF document
export const createModernPDF = async (data: PdfDocumentData) => {
  const doc = new jsPDF();
  
  // Set primary color
  const primaryColor = [25, 120, 116]; // #197874
  
  try {
    // Load and add logo
    const logoUrl = 'https://dabablane.com/assets/dabablanelogo.webp';
    let base64 = '';
    try {
      const response = await fetch(logoUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const blob = await response.blob();
      base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.warn('Failed to load logo:', error);
      // Continue without logo
    }
    
    // Add logo with smaller dimensions if available
    if (base64) {
      doc.addImage(base64, 'WEBP', 20, 20, 100, 24);
    }
    
    // Add company info
    doc.setFontSize(12);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont("helvetica", "bold");
    doc.text("DabaBlane", 20, 50);
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.setFont("helvetica", "normal");
    doc.text("Votre partenaire de confiance", 20, 57);
    
    // Add invoice title and reference
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text(data.title, 20, 70);
    
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.setFont("helvetica", "normal");
    doc.text(`Référence: ${data.referenceNumber}`, 20, 80);
    doc.text(`Date: ${new Date().toLocaleDateString('fr-FR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })}`, 20, 87);
    
    // Add separator line
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(0.5);
    doc.line(20, 95, 190, 95);
    
    // Add content with professional styling
    let y = 110;
    
    // Filter out empty values and add them to the PDF
    const filteredDetails = data.details.filter(detail => 
      detail.value !== null && 
      detail.value !== undefined && 
      detail.value !== '' && 
      String(detail.value).trim() !== ''
    );
    
    filteredDetails.forEach((detail) => {
      // Add label with primary color
      doc.setFontSize(11);
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFont("helvetica", "bold");
      doc.text(detail.label, 20, y);
      
      // Add value
      doc.setTextColor(0, 0, 0);
      doc.setFont("helvetica", "normal");
      doc.text(String(detail.value), 100, y);
      
      y += 10;
    });
    
    // Add total section with emphasis
    const totalY = y + 15;
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(0.5);
    doc.line(20, totalY - 5, 190, totalY - 5);
    
    // Find the total amount from details
    const totalAmount = filteredDetails.find(d => d.label.includes('Montant TTC'))?.value || 
                       filteredDetails.find(d => d.label.includes('Prix:'))?.value || '0.00';
    
    doc.setFontSize(14);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont("helvetica", "bold");
    doc.text(`Total TTC: ${totalAmount}`, 20, totalY + 10);
    
    // Add footer with professional styling
    const footerY = 280;
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(0.5);
    doc.line(20, footerY - 5, 190, footerY - 5);
    
    // Add company info in footer
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.setFont("helvetica", "normal");
    doc.text("DabaBlane - Votre partenaire de confiance", 20, footerY);
    doc.text("Merci de votre confiance", 20, footerY + 7);
    doc.text("www.dabablane.com", 170, footerY);
    doc.text("contact@dabablane.com", 170, footerY + 7);
    
    return doc;
  } catch (error) {
    console.error('Error loading logo:', error);
    // If logo fails to load, create PDF without logo
    return createPDFWithoutLogo(doc, data);
  }
};

// Helper function to create PDF without logo
export const createPDFWithoutLogo = (doc: jsPDF, data: PdfDocumentData) => {
  // Add company info
  doc.setFontSize(12);
  doc.setTextColor(25, 120, 116);
  doc.setFont("helvetica", "bold");
  doc.text("DabaBlane", 20, 20);
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.setFont("helvetica", "normal");
  doc.text("Votre partenaire de confiance", 20, 27);
  
  // Add invoice title and reference
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "bold");
  doc.text(data.title, 20, 40);
  
  doc.setFontSize(12);
  doc.setTextColor(100, 100, 100);
  doc.setFont("helvetica", "normal");
  doc.text(`Référence: ${data.referenceNumber}`, 20, 50);
  doc.text(`Date: ${new Date().toLocaleDateString('fr-FR', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  })}`, 20, 57);
  
  // Add separator line
  doc.setDrawColor(25, 120, 116);
  doc.setLineWidth(0.5);
  doc.line(20, 65, 190, 65);
  
  // Add content with professional styling
  let y = 80;
  
  // Filter out empty values and add them to the PDF
  const filteredDetails = data.details.filter(detail => 
    detail.value !== null && 
    detail.value !== undefined && 
    detail.value !== '' && 
    String(detail.value).trim() !== ''
  );
  
  filteredDetails.forEach((detail) => {
    // Add label with primary color
    doc.setFontSize(11);
    doc.setTextColor(25, 120, 116);
    doc.setFont("helvetica", "bold");
    doc.text(detail.label, 20, y);
    
    // Add value
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    doc.text(String(detail.value), 100, y);
    
    y += 10;
  });
  
  // Add total section with emphasis
  const totalY = y + 15;
  doc.setDrawColor(25, 120, 116);
  doc.setLineWidth(0.5);
  doc.line(20, totalY - 5, 190, totalY - 5);
  
  // Find the total amount from details
  const totalAmount = filteredDetails.find(d => d.label.includes('Montant TTC'))?.value || 
                     filteredDetails.find(d => d.label.includes('Prix:'))?.value || '0.00';
  
  doc.setFontSize(14);
  doc.setTextColor(25, 120, 116);
  doc.setFont("helvetica", "bold");
  doc.text(`Total TTC: ${totalAmount}`, 20, totalY + 10);
  
  // Add footer with professional styling
  const footerY = 280;
  doc.setDrawColor(25, 120, 116);
  doc.setLineWidth(0.5);
  doc.line(20, footerY - 5, 190, footerY - 5);
  
  // Add company info in footer
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.setFont("helvetica", "normal");
  doc.text("DabaBlane - Votre partenaire de confiance", 20, footerY);
  doc.text("Merci de votre confiance", 20, footerY + 7);
  doc.text("www.dabablane.com", 170, footerY);
  doc.text("contact@dabablane.com", 170, footerY + 7);
  
  return doc;
};

// Generate PDF details from order or reservation data
export interface Customer {
  name?: string;
  email?: string;
  city?: string;
  phone?: string;
  address?: string;
}

export interface Blane {
  name?: string;
  price_current?: string | number;
  tva?: number;
  type?: string;
  partiel_field?: number;
}

export interface OrderData {
  NUM_ORD?: string;
  delivery_address?: string;
  total_price?: string | number;
  partiel_price?: string | number;
  payment_method?: string;
  quantity?: number;
  customer?: Customer;
  blane?: Blane;
}

export interface ReservationData {
  NUM_RES?: string;
  total_price?: string | number;
  partiel_price?: string | number;
  payment_method?: string;
  number_persons?: number;
  date?: string;
  end_date?: string;
  time?: string;
  customer?: Customer;
  blane?: Blane;
  quantity?: number;
}

export const generatePdfDetails = (
  order: OrderData | null, 
  reservation: ReservationData | null,
  referenceNumber: string
): PdfDocumentData['details'] => {
  const details = [];
  
  if (order) {
    details.push(
      { label: "Client:", value: order?.customer?.name || '' },
      { label: "Adresse:", value: order?.delivery_address || '' },
      { label: "Ville:", value: order?.customer?.city || '' },
      { label: "Email:", value: order?.customer?.email || '' },
      { label: "Téléphone:", value: order?.customer?.phone || '' },
      { label: "Produit:", value: order?.blane?.name || '' },
      { label: "Prix unitaire:", value: `${formatAmount(order?.blane?.price_current)} MAD` },
      { label: "Quantité:", value: order?.quantity || 1 },
      ...(order?.blane?.tva && order?.blane?.tva > 0 ? [{ label: "TVA:", value: `${order?.blane?.tva}%` }] : []),
      { label: "Mode de paiement:", value: order?.payment_method === 'online' ? 'Paiement en ligne' : 
                                         order?.payment_method === 'cash' ? 'Paiement Cash' : 
                                         order?.payment_method === 'partiel' ? 'Paiement partiel' : 'N/A' }
    );

    // Add payment details if partial payment
    if (order?.payment_method === 'partiel' && order?.blane?.partiel_field) {
      const partialAmount = (parseFloat(formatAmount(order.total_price)) * (order.blane.partiel_field / 100));
      const remainingAmount = parseFloat(formatAmount(order.total_price)) - partialAmount;
      details.push(
        { label: "Montant TTC:", value: `${formatAmount(order.total_price)} MAD` },
        { label: "Prix Partiel:", value: `${formatAmount(partialAmount)} MAD` },
        { label: "Reste à payer sur place:", value: `${formatAmount(remainingAmount)} MAD` }
      );
    } else {
      details.push(
        { label: "Montant TTC:", value: `${formatAmount(order.total_price)} MAD` }
      );
    }
  } else if (reservation) {
    details.push(
      { label: "Client:", value: reservation?.customer?.name || '' },
      { label: "Email:", value: reservation?.customer?.email || '' },
      { label: "Téléphone:", value: reservation?.customer?.phone || '' },
      { label: reservation?.end_date ? "Période:" : "Date:", value: reservation?.end_date ? `${reservation?.end_date} - ${reservation?.date}` : reservation?.date || '' },
      { label: reservation?.end_date ? "Heure:" : "Heure:", value: reservation?.time || '' },
      { label: "Service:", value: reservation?.blane?.name || '' },
      { label: "Prix:", value: `${formatAmount(reservation?.blane?.price_current)} MAD` },
      { label: "Nombre de personnes:", value: reservation?.number_persons || 1 },
      ...(reservation?.blane?.tva && reservation?.blane?.tva > 0 ? [{ label: "TVA:", value: `${reservation?.blane?.tva}%` }] : []),
      { label: "Mode de paiement:", value: reservation?.payment_method === 'online' ? 'Paiement en ligne' : 
                                     reservation?.payment_method === 'cash' ? 'Paiement Cash' : 
                                     reservation?.payment_method === 'partiel' ? 'Paiement partiel' : 'N/A' }
    );

    // Add payment details if partial payment
    if (reservation?.payment_method === 'partiel' && reservation?.blane?.partiel_field) {
      const partialAmount = (parseFloat(formatAmount(reservation.total_price)) * (reservation.blane.partiel_field / 100));
      const remainingAmount = parseFloat(formatAmount(reservation.total_price)) - partialAmount;
      details.push(
        { label: "Montant TTC:", value: `${formatAmount(reservation.total_price)} MAD` },
        { label: "Prix Partiel:", value: `${formatAmount(partialAmount)} MAD` },
        { label: "Reste à payer sur place:", value: `${formatAmount(remainingAmount)} MAD` }
      );
    } else {
      details.push(
        { label: "Montant TTC:", value: `${formatAmount(reservation.total_price)} MAD` }
      );
    }
  }
  
  return details;
};

// Generate and download PDF
export const generateAndDownloadPDF = async (
  order: OrderData | null, 
  reservation: ReservationData | null,
  referenceNumber: string,
  onSuccess?: () => void,
  onError?: (error: any) => void
) => {
  try {
    const details = generatePdfDetails(order, reservation, referenceNumber);
    
    const doc = await createModernPDF({
      title: referenceNumber?.includes('ORDER') || order ? 'Détails de la commande' : 'Détails de la réservation',
      referenceNumber: referenceNumber || '',
      details
    });
    
    doc.save(`${referenceNumber || 'commande'}.pdf`);
    
    if (onSuccess) {
      onSuccess();
    }
    
    return true;
  } catch (error) {
    console.error('Error generating PDF:', error);
    
    if (onError) {
      onError(error);
    }
    
    return false;
  }
}; 