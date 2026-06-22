import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const getImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  return `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'}${path.replace(/\\/g, '/')}`;
};

const loadAndConvertImageToBase64 = (url) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      try {
        const dataURL = canvas.toDataURL('image/png');
        resolve({ dataUrl: dataURL, width: img.width, height: img.height });
      } catch (e) {
        console.error('Failed to convert image to base64 for', url, e);
        resolve(null);
      }
    };
    img.onerror = (err) => {
      console.error('Image load error for', url, err);
      resolve(null);
    };
    // Cache buster to prevent CORS cache issues
    img.src = url + (url.includes('?') ? '&' : '?') + 'cb=' + new Date().getTime();
  });
};

export const generateOrderPdf = async (order, options = { returnBlob: false }) => {
  console.log("generateOrderPdf started");
  try {
    const doc = new jsPDF();

    const company = order.buyer?.firm?.company;
    const firm = order.buyer?.firm;

    // --- COLORS & STYLES ---
    const primaryColor = [41, 128, 185]; // Professional blue
    const crimsonColor = [220, 20, 60];  // From original request
    const darkTextColor = [44, 62, 80];
    const lightTextColor = [100, 110, 115];

    // --- HEADER (Letterhead Style) ---
    let startY = 15;
    let logoRightX = 14;

    if (company?.logo) {
      console.log("Fetching company logo");
      const logoImg = await loadAndConvertImageToBase64(getImageUrl(company.logo));
      if (logoImg) {
        // Render logo 
        const maxLogoHeight = 25;
        const imgHeight = maxLogoHeight;
        const imgWidth = (logoImg.width * imgHeight) / logoImg.height;
        doc.addImage(logoImg.dataUrl, 'PNG', 14, startY, imgWidth, imgHeight);
        logoRightX = 14 + imgWidth + 5;
      }
    }

    // Company Name & Details next to Logo
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(crimsonColor[0], crimsonColor[1], crimsonColor[2]);
    doc.text(company?.name || "The Madras Silks", logoRightX, startY + 8);

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(lightTextColor[0], lightTextColor[1], lightTextColor[2]);
    const sellerAddress = company?.address || "Unit Of The Madras Silks India (P) Ltd, Chennai";
    const sellerAddressLines = doc.splitTextToSize(sellerAddress, 90);
    doc.text(sellerAddressLines, logoRightX, startY + 13);

    let nextY = startY + 13 + (sellerAddressLines.length * 4);
    if (company?.gst) {
      doc.setFont("helvetica", "bold");
      doc.text(`GST:`, logoRightX, nextY);
      doc.setFont("helvetica", "normal");
      doc.text(company.gst, logoRightX + 10, nextY);
      nextY += 4;
    }
    if (company?.phone) {
      doc.setFont("helvetica", "bold");
      doc.text(`Phone:`, logoRightX, nextY);
      doc.setFont("helvetica", "normal");
      doc.text(company.phone, logoRightX + 13, nextY);
    }

    // Order Type & Details (Right Aligned)
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("REQUIREMENT ORDER", 196, startY + 6, { align: "right" });

    doc.setFontSize(10);
    doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
    doc.text(`Order No: ${order.orderNumber}`, 196, startY + 13, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.text(`Date: ${new Date(order.orderDate).toLocaleDateString()}`, 196, startY + 18, { align: "right" });
    if (order.transporter?.name) {
      doc.text(`Transport: ${order.transporter.name}`, 196, startY + 23, { align: "right" });
    }

    startY = Math.max(nextY, startY + 25) + 5;

    // --- DIVIDER ---
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(0.8);
    doc.line(14, startY, 196, startY);
    startY += 8;

    // --- TO (BUYER) SECTION ---
    doc.setFillColor(245, 247, 250);
    doc.rect(14, startY, 182, 35, 'F'); // Background box for buyer details

    const toX = 20;
    let buyerY = startY + 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.text("BILL TO (BUYER):", toX, buyerY);

    buyerY += 6;
    doc.setFontSize(12);
    doc.setTextColor(darkTextColor[0], darkTextColor[1], darkTextColor[2]);
    const buyerName = order.buyer?.name || "";
    const firmName = firm?.name ? ` (${firm.name})` : "";
    doc.text(`${buyerName}${firmName}`, toX, buyerY);

    buyerY += 5;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const buyerAddress = order.buyer?.billingAddress || firm?.address || "No Address Provided";
    const buyerAddressLines = doc.splitTextToSize(buyerAddress, 100);
    doc.text(buyerAddressLines, toX, buyerY);

    buyerY += (buyerAddressLines.length * 4) + 1;
    const buyerGst = order.buyer?.gst || firm?.gstNumber;
    if (buyerGst) {
      doc.setFont("helvetica", "bold");
      doc.text("GST:", toX, buyerY);
      doc.setFont("helvetica", "normal");
      doc.text(buyerGst, toX + 10, buyerY);
      buyerY += 4;
    }
    const buyerMobile = order.buyer?.mobile || firm?.mobile;
    if (buyerMobile) {
      doc.setFont("helvetica", "bold");
      doc.text("Mobile:", toX, buyerY);
      doc.setFont("helvetica", "normal");
      doc.text(buyerMobile, toX + 13, buyerY);
    }

    startY += 40; // Move past the buyer box

    if (order.remarks) {
      doc.setFont("helvetica", "bold");
      doc.text("Remarks:", 14, startY);
      doc.setFont("helvetica", "normal");
      const remarksLines = doc.splitTextToSize(order.remarks, 160);
      doc.text(remarksLines, 32, startY);
      startY += (remarksLines.length * 4) + 4;
    }

    // --- TABLE ---
    startY += 2;
    const tableData = [];
    const itemImages = [];
    let totalQty = 0;

    for (const item of order.items) {
      totalQty += item.quantity;
      let imgObj = null;
      let imgUrl = null;

      if (item.design?.image) {
        const imagesList = item.design.image.split(',').map(img => img.trim()).filter(Boolean);
        if (imagesList.length > 0) {
          if (item.color && item.design.imageColorMap) {
            try {
              const colorMap = typeof item.design.imageColorMap === 'string'
                ? JSON.parse(item.design.imageColorMap)
                : item.design.imageColorMap;
              if (Array.isArray(colorMap)) {
                const colorIndex = colorMap.findIndex(
                  c => c && c.trim().toLowerCase() === item.color.trim().toLowerCase()
                );
                if (colorIndex !== -1 && imagesList[colorIndex]) {
                  imgUrl = imagesList[colorIndex];
                }
              }
            } catch (e) { }
          }
          if (!imgUrl) imgUrl = imagesList[0];
        }
      }

      if (imgUrl) {
        imgObj = await loadAndConvertImageToBase64(getImageUrl(imgUrl));
      }
      itemImages.push(imgObj);

      tableData.push([
        tableData.length + 1,
        item.design?.code || '',
        item.design?.name || '',
        item.color || 'Default',
        item.rate.toFixed(2),
        item.quantity,
        (item.rate * item.quantity).toFixed(2),
        '' // Image placeholder
      ]);
    }

    autoTable(doc, {
      startY: startY,
      head: [['#', 'Item Code', 'Item Name', 'Color', 'Rate (Rs)', 'Qty', 'Total (Rs)', 'Image']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 4, valign: 'middle' },
      headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold' },
      columnStyles: {
        0: { halign: 'center', cellWidth: 12 },
        4: { halign: 'right' },
        5: { halign: 'center' },
        6: { halign: 'right' },
        7: { minCellWidth: 20, minCellHeight: 25, halign: 'center' }
      },
      didDrawCell: function (data) {
        if (data.column.index === 7 && data.cell.section === 'body') {
          const img = itemImages[data.row.index];
          if (img && img.dataUrl) {
            try {
              const cellWidth = data.cell.width;
              const cellHeight = data.cell.height;
              const imgDim = 18;
              const xPos = data.cell.x + (cellWidth - imgDim) / 2;
              const yPos = data.cell.y + (cellHeight - imgDim) / 2;
              doc.addImage(img.dataUrl, 'PNG', xPos, yPos, imgDim, imgDim);
            } catch (err) {
              console.error('Error adding image to cell', err);
            }
          }
        }
      }
    });

    // --- HELPER FOR NUMBER TO WORDS ---
    const numberToWords = (num) => {
      const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
      const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
      if ((num = num.toString()).length > 9) return 'overflow';
      let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
      if (!n) return; let str = '';
      str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
      str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
      str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
      str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
      str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) + 'Only' : 'Only';
      return str;
    };

    // --- FOOTER / TOTALS ---
    let finalY = doc.lastAutoTable.finalY + 5;

    // Total amounts and GST calculations
    const totalGst = order.gstAmount || 0;
    const cgst = totalGst / 2;
    const sgst = totalGst / 2;
    const amountInWords = numberToWords(Math.round(order.grandTotal));

    // Calculate dynamic GST text
    let gstRatesText = 'GST : 5 %';
    if (order.items && order.items.length > 0) {
      const uniqueGstRates = [...new Set(order.items.map(item => item.taxPercent || item.design?.gstPercent || 5))];
      if (uniqueGstRates.length === 1) {
        gstRatesText = `GST : ${uniqueGstRates[0]} %`;
      } else if (uniqueGstRates.length > 1) {
        gstRatesText = `GST : Multiple Rates (${uniqueGstRates.join('%, ')}%)`;
      }
    }

    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(0.3);

    // GST & Totals Grid
    autoTable(doc, {
      startY: finalY,
      body: [
        [
          { content: `Total Quantity: ${totalQty}`, colSpan: 3 },
          { content: `Total Amount (Without GST): Rs. ${order.totalAmount.toFixed(2)}`, colSpan: 2, styles: { halign: 'right' } }
        ],
        [
          { content: gstRatesText, colSpan: 3 },
          { content: `GST VALUE : Rs. ${totalGst.toFixed(2)}`, colSpan: 2, styles: { halign: 'right' } }
        ],
        [
          { content: `Amount in Words: ${amountInWords}`, colSpan: 3, styles: { fillColor: [240, 245, 250], textColor: primaryColor, fontStyle: 'bold' } },
          { content: `Grand Total: Rs. ${order.grandTotal.toFixed(2)}`, colSpan: 2, styles: { halign: 'right', fillColor: [240, 245, 250], textColor: primaryColor, fontStyle: 'bold' } }
        ]
      ],
      theme: 'grid',
      styles: { fontSize: 8, cellPadding: 3, textColor: darkTextColor },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 35 },
        2: { cellWidth: 40 },
        3: { cellWidth: 40 },
        4: { cellWidth: 'auto' }
      }
    });

    finalY = doc.lastAutoTable.finalY + 2;

    // Terms & Conditions
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("Terms & Conditions", 105, finalY + 4, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    const terms = [
      "1. Order Confirmation: All orders are subject to acceptance and confirmation by the seller.",
      "2. Price Validity: Prices displayed on the portal are wholesale prices and may change without prior notice.",
      "3. Credit Facility and payment terms: Credit payment is available only to approved buyers. Credit limits and payment periods are decided by the seller.",
      "4. Credit Payment Due Date: Buyers must make payment within the agreed credit period. Delayed payments may result in suspension of further orders.",
      "5. Late Payment Charges: The seller reserves the right to charge 18% interest or late fees on overdue payments as permitted by applicable law.",
      "6. Product Availability: All products are subject to stock availability. If an item is unavailable, the buyer will be informed accordingly.",
      "7. Returns and Claims: Returns are accepted only for damaged, defective, or wrongly supplied products. Claims must be raised within 15 days of delivery with supporting photos.",
      "8. Shipping and Delivery: Delivery dates are estimates only. The seller is not responsible for delays caused by transporters, couriers, or unforeseen circumstances.",
      "9. Ownership of Goods: Goods supplied on credit remain the property of the seller until full payment is received. The seller reserves the right to recover goods in case of payment default.",
      "Declaration: By placing an order through the portal, the buyer confirms that they have read, understood, and agreed to these Terms & Conditions."
    ];

    let termY = finalY + 8;
    terms.forEach(term => {
      if (term.startsWith('Declaration:')) {
        doc.setFont("helvetica", "normal");
        const lines = doc.splitTextToSize(term, 182);
        doc.text(lines, 14, termY);
        termY += lines.length * 3.5;
      } else {
        const colonIndex = term.indexOf(':');
        if (colonIndex !== -1) {
          const title = term.substring(0, colonIndex + 1);
          const rest = term.substring(colonIndex + 1).trim();

          doc.setFont("helvetica", "bold");
          doc.text(title, 14, termY);
          const titleWidth = doc.getTextWidth(title);

          doc.setFont("helvetica", "normal");
          const words = rest.split(' ');
          let currentX = 14 + titleWidth + doc.getTextWidth(' ');
          let line = '';

          for (let i = 0; i < words.length; i++) {
            const word = words[i];
            const testLine = line + (line ? ' ' : '') + word;
            const testWidth = doc.getTextWidth(testLine);

            if (currentX + testWidth > 196) {
              if (line !== '') {
                doc.text(line, currentX, termY);
                termY += 3.5;
                currentX = 14;
                line = word;
              } else {
                termY += 3.5;
                currentX = 14;
                line = word;
              }
            } else {
              line = testLine;
            }
          }
          if (line) {
            doc.text(line, currentX, termY);
            termY += 3.5;
          }
        } else {
          doc.setFont("helvetica", "normal");
          const lines = doc.splitTextToSize(term, 182);
          doc.text(lines, 14, termY);
          termY += lines.length * 3.5;
        }
      }
      
      if (termY > 275) {
        doc.addPage();
        termY = 20;
      }
    });

    if (termY > 240) {
      doc.addPage();
      termY = 20;
    }

    // Agreement line
    doc.setDrawColor(200, 200, 200);
    doc.line(14, termY + 2, 196, termY + 2);

    doc.setFontSize(8);
    doc.text("Delivery Date:", 14, termY + 6);
    doc.setFont("helvetica", "bold");
    doc.text(`For ${company?.name || 'The Madras Silks India Pvt Ltd'}`, 196, termY + 6, { align: "right" });

    doc.line(14, termY + 10, 196, termY + 10);

    termY += 16;
    if (order.orderGivenBy) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      let givenByText = `Order Given By: ${order.orderGivenBy}`;
      if (order.orderGivenByPhone) givenByText += ` (Ph: ${order.orderGivenByPhone})`;
      doc.text(givenByText, 14, termY);
    }

    // Signatures
    termY += 15;
    if (order.signature) {
      try {
        const sigImg = await loadAndConvertImageToBase64(getImageUrl(order.signature));
        if (sigImg && sigImg.dataUrl) {
          // Calculate width to maintain aspect ratio with max height of 12
          const imgHeight = 12;
          const imgWidth = (sigImg.width * imgHeight) / sigImg.height;
          doc.addImage(sigImg.dataUrl, 'PNG', 14, termY - 14, imgWidth, imgHeight);
        }
      } catch (e) {
        console.error("Signature image error", e);
      }
    }

    doc.setFont("helvetica", "normal");
    doc.text("Buyer Signature", 14, termY);
    doc.text("Authorised Signatory", 196, termY, { align: "right" });

    // Registered Office Footer
    doc.setFontSize(7);
    const addressStr = company?.address || 'No.55,Usman Road,T.Nagar,Chennai-600017';
    const emailStr = company?.email || 'xxxxxxxxxx';
    let footerText = `Reg Office: ${addressStr.trim()} | E-Mail: ${emailStr.trim()}`;
    if (company?.phone) {
      footerText += ` | Phone: ${company.phone.trim()}`;
    }
    const footerLines = doc.splitTextToSize(footerText, 170);
    const boxHeight = footerLines.length * 3.5 + 4;

    doc.setFillColor(245, 247, 250);
    doc.rect(14, termY + 5, 182, boxHeight, 'F');
    doc.text(footerLines, 105, termY + 9, { align: "center" });

    console.log("Saving PDF...");
    const buyerNameForFile = company?.name || firm?.name || order.buyer?.name || "Customer";
    const safeName = buyerNameForFile.replace(/[^a-zA-Z0-9-_]/g, '_');
    const filename = `Order_${order.orderNumber}_${safeName}.pdf`;

    if (options.returnBlob) {
      return doc.output('blob');
    }

    doc.save(filename);
    console.log("PDF saved successfully!");
  } catch (error) {
    console.error("Error generating PDF:", error);
    alert("Failed to generate PDF. Check console for details.");
  }
};
