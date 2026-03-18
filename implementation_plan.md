# Add Date Column to Reports

## Goal Description
The user wants to include a "Data" column formatted as `dd/mm/aaaa` (Day/Month/Year) in the PDF and Excel reports for both "Apontamentos" and "Chamados".

## Proposed Changes

### [Utils] src/lib/export.ts
#### [MODIFY] [export.ts](file:///c:/Users/User/Documents/geradorDeRelatórios/sharepoint-reports/src/lib/export.ts)
- Update `columnMapping` in `exportToPDF` to include:
    - `'Data': 'DATA'`
- Update `columnStyles` in `exportToPDF` to ensure the new column fits.

### [Feature] Apontamentos Report
#### [MODIFY] [page.tsx](file:///c:/Users/User/Documents/geradorDeRelatórios/sharepoint-reports/src/app/(dashboard)/apontamentos/page.tsx)
- Modify `handleExportPDF`:
    - Process `data` to add a `Data` field.
        - Logic: Check if `item.Data` exists. If not, try to extract date from `item.Hora_x0020_Inicio` (or similar raw field if available in `...fields`). If explicit `Data` field is missing, we might need to rely on `Created` or ensuring the API returns the raw start time.
        - *Correction*: The API `route.ts` returns `...fields`. `Hora_x0020_Inicio` should be there. I will look for `Data`, if not use `Hora_x0020_Inicio`.
        - Format: `dd/mm/yyyy`.
    - Add `'Data'` to the columns list passed to `exportToPDF`.
    - Reorder columns to show `Data` likely as the first or second column.
- Modify `handleExportExcel`:
    - Map `data` to include the `Data` field.
    - Pass processed data to `exportToExcel`.

### [Feature] Chamados Report
#### [MODIFY] [page.tsx](file:///c:/Users/User/Documents/geradorDeRelatórios/sharepoint-reports/src/app/(dashboard)/chamados/page.tsx)
- Modify `handleExportPDF`:
    - Process `data` to add a `Data` field.
        - Logic: Extract date part from `item.Created` or `item.CreatedFormatted`.
        - Format: `dd/mm/yyyy`.
    - Add `'Data'` to the columns list passed to `exportToPDF`.
- Modify `handleExportExcel`:
    - Map `data` to include the `Data` field.
    - Pass processed data to `exportToExcel`.

## Verification Plan

### Manual Verification
1.  **Apontamentos**:
    - Generate PDF/Excel.
    - Verify "DATA" column exists and shows `dd/mm/yyyy`.
2.  **Chamados**:
    - Generate PDF/Excel.
    - Verify "DATA" column exists and shows `dd/mm/yyyy`.
