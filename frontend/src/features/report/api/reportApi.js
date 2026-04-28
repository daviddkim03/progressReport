// features/report/api/reportApi.js
import apiClient from '../../../services/apiClient.js';

export async function fetchStudents() {
  const response = await apiClient.get('/students');
  return response.data.data;
}

export async function previewReport(payload) {
  const response = await apiClient.post('/report/preview', payload);
  return response.data.data;
}

export async function downloadReport(payload) {
  const response = await apiClient.post('/report', payload, {
    responseType: 'arraybuffer',
  });
  const disposition = response.headers['content-disposition'] || '';
  const match = disposition.match(/filename="?([^"]+)"?/);
  const filename = match ? match[1] : `progress-report.pdf`;
  return { buffer: response.data, filename };
}
