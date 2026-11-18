import { useState } from 'react';
import { Search, Plus, Upload, Edit2, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Modal, ConfirmModal, Field, EmptyState } from './components';

const PAGE_SIZE = 8;

/*
  One page for Add / Edit / Delete / Search / Bulk import.
  Props:
    noun        "Student"
    rows        list of records
    columns     [{ label, render(row) }]
    fields      form fields (see Field in components.jsx)
    searchText  (row) => string to search in
    onAdd(values), onEdit(id, values), onDelete(id)
    validate    (values, editingRow, batch) => error string or null
    canDelete   (row) => string (reason it is blocked) or null
    deleteNote  (row) => extra warning text
    nameOf      (row) => name shown in the delete message
    bulk        { fields: [names in CSV order], hint, defaults, onImport(list) }
*/
export default function CrudPage({
  noun, rows, columns, fields, searchText, onAdd, onEdit, onDelete,
  validate, canDelete, deleteNote, nameOf = (r) => r.name, bulk, notify,
}) {
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [modal, setModal] = useState(null); // { type: 'add' | 'edit' | 'delete' | 'bulk', row }
  const [form, setForm] = useState({});
  const [error, setError] = useState('');
  const [bulkText, setBulkText] = useState('');

  const q = query.trim().toLowerCase();
  const filtered = q ? rows.filter((r) => searchText(r).toLowerCase().includes(q)) : rows;
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  const start = (current - 1) * PAGE_SIZE;
  const visible = filtered.slice(start, start + PAGE_SIZE);

  const blank = () => Object.fromEntries(fields.map((f) => [f.name, f.default ?? '']));
  const clean = (values) =>
    Object.fromEntries(
      fields.map((f) => {
        let v = values[f.name] ?? '';
        if (typeof v === 'string') v = v.trim();
        if (f.type === 'number' && v !== '') v = Number(v);
        return [f.name, v];
      })
    );

  const open = (type, row = null) => {
    setError('');
    setBulkText('');
    setForm(type === 'edit' ? { ...row } : blank());
    setModal({ type, row });
  };
  const close = () => setModal(null);
  const change = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = (e) => {
    e.preventDefault();
    const values = clean(form);
    const err = validate?.(values, modal.row, []);
    if (err) return setError(err);
    if (modal.type === 'add') onAdd(values);
    else onEdit(modal.row.id, values);
    notify(`${noun} ${modal.type === 'add' ? 'added' : 'updated'}.`);
    close();
  };

  const readFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setBulkText(String(reader.result));
    reader.readAsText(file);
  };

  const importBulk = () => {
    const header = fields.find((f) => f.name === bulk.fields[0])?.label.toLowerCase();
    const lines = bulkText.split('\n').map((l) => l.trim()).filter(Boolean);
    const good = [];
    let bad = 0;
    lines.forEach((line, i) => {
      const cells = line.split(',').map((c) => c.trim());
      if (i === 0 && cells[0].toLowerCase() === header) return; // skip header row
      const raw = { ...blank(), ...(bulk.defaults || {}) };
      bulk.fields.forEach((name, k) => { raw[name] = cells[k] || ''; });
      const values = clean(raw);
      const missing = fields.some((f) => !f.optional && values[f.name] === '');
      if (missing || validate?.(values, null, good)) { bad += 1; return; }
      good.push(values);
    });
    if (!good.length) return setError('No valid rows found. Check the format and try again.');
    bulk.onImport(good);
    notify(`Imported ${good.length} ${noun.toLowerCase()}(s)${bad ? `, skipped ${bad} invalid row(s)` : ''}.`);
    close();
  };

  const confirmDelete = () => {
    onDelete(modal.row.id);
    notify(`${noun} deleted.`);
    close();
  };

  const blocked = modal?.type === 'delete' ? canDelete?.(modal.row) : null;

  return (
    <>
      <div className="toolbar no-print">
        <div className="search-bar">
          <input
            type="text"
            placeholder={`Search ${noun.toLowerCase()}s...`}
            aria-label={`Search ${noun.toLowerCase()}s`}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
          />
          <div className="btn-icon"><Search size={18} /></div>
        </div>
        <div className="action-buttons">
          <button className="btn-primary" onClick={() => open('add')}><Plus size={18} /> Add New</button>
          {bulk && <button className="btn-secondary" onClick={() => open('bulk')}><Upload size={18} /> Add Multiple</button>}
        </div>
      </div>

      <div className="table-container">
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>#</th>
                {columns.map((c) => <th key={c.label}>{c.label}</th>)}
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((row, i) => (
                <tr key={row.id}>
                  <td>{start + i + 1}</td>
                  {columns.map((c) => <td key={c.label}>{c.render(row)}</td>)}
                  <td>
                    <div className="actions-cell">
                      <button className="action-edit" title="Edit" aria-label={`Edit ${nameOf(row)}`} onClick={() => open('edit', row)}><Edit2 size={16} /></button>
                      <button className="action-delete" title="Delete" aria-label={`Delete ${nameOf(row)}`} onClick={() => open('delete', row)}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {visible.length === 0 && (
            <EmptyState
              text={q ? 'No results. Try a different search.' : `No ${noun.toLowerCase()}s yet. Click "Add New" to create one.`}
            />
          )}
        </div>
        <div className="table-footer">
          <span>
            {filtered.length ? `Showing ${start + 1}-${start + visible.length} of ${filtered.length}` : '0 results'}
          </span>
          <div className="pager">
            <button className="action-edit" aria-label="Previous page" disabled={current === 1} onClick={() => setPage(current - 1)}><ChevronLeft size={16} /></button>
            <span>Page {current} of {pages}</span>
            <button className="action-edit" aria-label="Next page" disabled={current === pages} onClick={() => setPage(current + 1)}><ChevronRight size={16} /></button>
          </div>
        </div>
      </div>

      {(modal?.type === 'add' || modal?.type === 'edit') && (
        <Modal title={`${modal.type === 'add' ? 'Add New' : 'Edit'} ${noun}`} onClose={close}>
          <form onSubmit={submit}>
            {error && <div className="form-error" role="alert">{error}</div>}
            {fields.map((f) => <Field key={f.name} field={f} value={form[f.name]} onChange={change} />)}
            <div className="modal-actions">
              <button type="button" className="btn-cancel" onClick={close}>Cancel</button>
              <button type="submit" className="btn-primary">Save {noun}</button>
            </div>
          </form>
        </Modal>
      )}

      {modal?.type === 'bulk' && (
        <Modal title={`Add Multiple ${noun}s`} onClose={close}>
          {error && <div className="form-error" role="alert">{error}</div>}
          <p style={{ marginBottom: '0.75rem' }}>Upload a CSV file or paste one {noun.toLowerCase()} per line.</p>
          <p className="form-hint" style={{ marginBottom: '0.75rem' }}>Order: {bulk.hint}</p>
          <input type="file" accept=".csv,.txt" onChange={readFile} style={{ marginBottom: '0.75rem' }} />
          <textarea
            className="bulk-textarea"
            rows="6"
            placeholder={bulk.hint}
            value={bulkText}
            onChange={(e) => setBulkText(e.target.value)}
          />
          {bulk.note && <p className="form-hint">{bulk.note}</p>}
          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={close}>Cancel</button>
            <button type="button" className="btn-primary" onClick={importBulk} disabled={!bulkText.trim()}>Import Data</button>
          </div>
        </Modal>
      )}

      {modal?.type === 'delete' && blocked && (
        <Modal title="Cannot Delete" onClose={close}>
          <p>{blocked}</p>
          <div className="modal-actions"><button type="button" className="btn-primary" onClick={close}>OK</button></div>
        </Modal>
      )}

      {modal?.type === 'delete' && !blocked && (
        <ConfirmModal
          title="Confirm Delete"
          message={
            <p>
              Are you sure you want to delete <strong>{nameOf(modal.row)}</strong>? This action cannot be undone.
              {deleteNote?.(modal.row) && <> {deleteNote(modal.row)}</>}
            </p>
          }
          onConfirm={confirmDelete}
          onClose={close}
        />
      )}
    </>
  );
}