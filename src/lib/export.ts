export async function exportToPDF(data: any[], title: string, columns: string[]) {
    const jsPDF = (await import("jspdf")).default;
    const autoTable = (await import("jspdf-autotable")).default;
    // Usar Paisagem (Landscape) para dar mais espaço horizontal
    const doc = new jsPDF('l', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const today = new Date().toLocaleDateString('pt-BR');

    // --- Header Estilizado ---
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 35, 'F');

    doc.setTextColor(45, 212, 191);
    doc.setFontSize(24);
    doc.setFont("helvetica", "bold");
    doc.text(title.toUpperCase(), 14, 18);

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Relatório gerado em: ${today}`, 14, 28);

    // Canal counts sumary for Chamados
    if (title.toLowerCase().includes("chamados")) {
        const counts = data.reduce((acc: any, item: any) => {
            const c = (item.Canal || "Sem Canal").trim().toLowerCase();
            acc[c] = (acc[c] || 0) + 1;
            return acc;
        }, {});
        const parts = Object.entries(counts).map(([c, count]) => {
            const label = c === "remoto" ? "remotos" : c === "presencial" ? "presenciais" : c;
            return `${count} ${label}`;
        });
        if (parts.length > 0) {
            const txt = `Atendimentos: ${parts.join(' | ')}`;
            // Draw next to date, e.g at x=75
            doc.text(txt, 75, 28);
        }
    }

    doc.text(`Total de registros: ${data.length}`, pageWidth - 50, 28);

    const columnMapping: { [key: string]: string } = {
        'Title': 'TÍTULO / ID',
        'Cliente': 'CLIENTE',
        'Data': 'DATA',
        'Created': 'DATA',
        'CreatedFormatted': 'DATA DE ABERTURA',
        'Status': 'STATUS',
        'Tecnico': 'RESPONSÁVEL',
        'HoraInicioFormatada': 'INÍCIO',
        'HoraFinalFormatada': 'FIM',
        'Horas': 'DUR.',
        'DuracaoFormatada': 'DURAÇÃO',
        'Descricao': 'DESCRIÇÃO',
        'Observacoes': 'OBSERVAÇÕES'
    };

    // Cálculo do total de horas (se for apontamentos)
    let totalDecimal = 0;
    const isApontamentos = title.toLowerCase().includes("apontamentos");
    if (isApontamentos) {
        data.forEach(item => {
            totalDecimal += parseFloat(item.Horas as any) || 0;
        });
    }

    const friendlyHeaders = columns.map(col => columnMapping[col] || col.toUpperCase());
    const tableData = data.map(item => columns.map(col => {
        const val = item[col];
        if (col === 'Horas' && val) return `${val}h`;
        return val || "-";
    }));

    autoTable(doc, {
        head: [friendlyHeaders],
        body: tableData,
        startY: 45,
        theme: 'striped',
        styles: {
            fontSize: 9,
            cellPadding: 3.5,
            overflow: 'linebreak',
            valign: 'middle'
        },
        headStyles: {
            fillColor: [45, 212, 191], // Accent Teal
            textColor: [15, 23, 42],   // Dark Primary
            fontSize: 10,
            fontStyle: 'bold',
            halign: 'left'
        },
        bodyStyles: {
            textColor: [51, 65, 85] // Slate 700
        },
        alternateRowStyles: {
            fillColor: [248, 250, 252] // Slate 50
        },
        columnStyles: {
            // Larguras otimizadas para Paisagem (Total ~280mm)
            [columns.indexOf('Title')]: { cellWidth: 45, fontStyle: 'bold' },
            [columns.indexOf('Data')]: { cellWidth: 25 },
            [columns.indexOf('Tecnico')]: { cellWidth: 40 },
            [columns.indexOf('HoraInicioFormatada')]: { cellWidth: 22 },
            [columns.indexOf('HoraFinalFormatada')]: { cellWidth: 22 },
            [columns.indexOf('DuracaoFormatada')]: { cellWidth: 30 },
            [columns.indexOf('Descricao')]: { cellWidth: 'auto' },
            [columns.indexOf('Observacoes')]: { cellWidth: 'auto' }
        },
        margin: { top: 45, left: 14, right: 14, bottom: 25 },
        didDrawPage: (data) => {
            doc.setFontSize(8);
            doc.setTextColor(148, 163, 184);
            const str = "Página " + (doc.internal as any).getNumberOfPages();
            doc.text(str, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
        }
    });

    if (isApontamentos) {
        const finalY = (doc as any).lastAutoTable.finalY + 10;
        const totalMinutes = Math.round(totalDecimal * 60);
        const wholeHours = Math.floor(totalMinutes / 60);
        const remainingMinutes = totalMinutes % 60;

        doc.setFillColor(241, 245, 249);
        doc.rect(14, finalY, 120, 12, 'F');

        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(15, 23, 42);
        doc.text(`TOTAL GERAL DE HORAS: ${wholeHours}h ${remainingMinutes}min`, 18, finalY + 8);
    }

    const fileName = `${title.toLowerCase().replace(/\s/g, "_")}_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(fileName);
}

export async function exportToExcel(data: any[], title: string) {
    const XLSX = await import("xlsx");
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Dados");
    XLSX.writeFile(workbook, `${title.toLowerCase().replace(/\s/g, "_")}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}
