import { PageHero, SurfacePanel, EmptyNotice } from '../components/DashboardSurface';

export default function ImportInvestmentsPage() {
  return (
    <section className="ww-space-y-6">
      <PageHero eyebrow="Import" title="Import investments from CSV" description="Upload your transaction history or CAS PDF to populate your portfolio automatically." />
      <SurfacePanel title="CSV Upload" subtitle="Bulk import your investment plans from a CSV file.">
        <EmptyNotice message="CSV import will be functional once the Spring Boot backend with Apache PDFBox is connected. Supported formats: CAS PDF, CSV with columns (fund_name, amc, category, mode, amount, frequency)." />
      </SurfacePanel>
    </section>
  );
}
