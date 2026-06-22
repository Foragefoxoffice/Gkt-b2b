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

export const generateOrderPdf = async (order) => {
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
        item.lineTotal.toFixed(2),
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

    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(0.3);

    // GST & Totals Grid
    autoTable(doc, {
      startY: finalY,
      body: [
        ['SGST : 2.5 %', 'CGST : 2.5 %', `SGST : Rs. ${cgst.toFixed(2)}`, `CGST : Rs. ${sgst.toFixed(2)}`, `GST VALUE : Rs. ${totalGst.toFixed(2)}`],
        [
          { content: `Amount in Words: ${amountInWords}`, colSpan: 3, styles: { fillColor: [240, 245, 250], textColor: primaryColor, fontStyle: 'bold' } }, 
          { content: `Total Quantity: ${totalQty}    Total Amount: Rs. ${order.grandTotal.toFixed(2)}`, colSpan: 2, styles: { halign: 'right', fillColor: [240, 245, 250], textColor: primaryColor, fontStyle: 'bold' } }
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
      "1. Materials should be delivered as per our exact specifications. Substandard goods will be summarily rejected.",
      "2. Goods must be delivered on or before the due date. Penalty @ 2% will be recovered if delayed.",
      "3. Part supply / shipment will be subject to our written acceptance only.",
      "4. GST Number must be mentioned in all your Bills / Invoices invariably.",
      "5. Subject to Chennai Jurisdiction.",
      "6. Details of our Purchase Order Number to be strictly mentioned in each of L.R.copy & Bundle.",
      "7. As per our ISO Policy, our Product code detail should be strictly mentioned in every product."
    ];

    let termY = finalY + 8;
    terms.forEach(term => {
      doc.text(term, 14, termY);
      termY += 4;
    });

    // Agreement line
    doc.setDrawColor(200, 200, 200);
    doc.line(14, termY + 2, 196, termY + 2);

    doc.setFontSize(8);
    doc.text("I/We agree for the above terms & conditions, Thank you.", 14, termY + 6);
    doc.text("Delivery Date:", 105, termY + 6, { align: "center" });
    doc.setFont("helvetica", "bold");
    doc.text(`For ${company?.name || 'The Madras Silks India Pvt Ltd'}`, 196, termY + 6, { align: "right" });

    doc.line(14, termY + 10, 196, termY + 10);

    // Signatures
    termY += 25;
    doc.setFont("helvetica", "normal");
    doc.text("Vendor Signature", 30, termY, { align: "center" });
    doc.text("Authorised Signatory", 170, termY, { align: "center" });

    // Registered Office Footer
    doc.setFillColor(245, 247, 250);
    doc.rect(14, termY + 5, 182, 8, 'F');
    doc.setFontSize(7);
    doc.text(`Reg Office: ${company?.address || 'No.55,Usman Road,T.Nagar,Chennai-600017'} | E-Mail: ${company?.email || 'acc@themadressilks.com'}`, 105, termY + 10, { align: "center" });

    console.log("Saving PDF...");
    const buyerNameForFile = company?.name || firm?.name || order.buyer?.name || "Customer";
    const safeName = buyerNameForFile.replace(/[^a-zA-Z0-9-_]/g, '_');
    doc.save(`Order_${order.orderNumber}_${safeName}.pdf`);
    console.log("PDF saved successfully!");
  } catch (error) {
    console.error("Error generating PDF:", error);
    alert("Failed to generate PDF. Check console for details.");
  }
};
