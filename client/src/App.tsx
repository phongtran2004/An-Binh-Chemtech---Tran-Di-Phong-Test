import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';
import CustomersPage from './pages/CustomersPage';
import CustomerDetailPage from './pages/CustomerDetailPage';
import CreateQuotationPage from './pages/CreateQuotationPage';
import QuotationsPage from './pages/QuotationsPage';
import QuotationDetailPage from './pages/QuotationDetailPage';

/**
 * App - Root component with routing configuration and global error boundary.
 *
 * Routes:
 * /                              → Customer list (landing)
 * /customers/:id                 → Customer detail + quotation history
 * /customers/:id/quotation/new   → Create new quotation form
 * /quotations                    → All quotations list
 * /quotations/:id                → Quotation detail + status + download
 */

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<CustomersPage />} />
            <Route path="/customers/:id" element={<CustomerDetailPage />} />
            <Route path="/customers/:id/quotation/new" element={<CreateQuotationPage />} />
            <Route path="/quotations" element={<QuotationsPage />} />
            <Route path="/quotations/:id" element={<QuotationDetailPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
