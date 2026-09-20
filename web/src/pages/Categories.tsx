import React, { useEffect, useState } from 'react';
import Modal from '../components/Modal';
import { categoryService } from '../api/categories';
import type { Category } from '../api/categories';

const emptyForm = { name: '', description: '' };

const Categories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingCategoryId, setDeletingCategoryId] = useState<number | null>(
    null,
  );
  const [error, setError] = useState('');

  const fetchCategories = async () => {
    try {
      const response = await categoryService.getCategories();
      setCategories(response.data?.categories || response.data || []);
    } catch (fetchError) {
      console.error('Failed to fetch categories', fetchError);
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const closeModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData(emptyForm);
    setError('');
  };

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormData(emptyForm);
    setError('');
    setShowModal(true);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
    });
    setError('');
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      setError('Category name is required');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      if (editingCategory) {
        await categoryService.updateCategory(editingCategory.id, formData);
      } else {
        await categoryService.createCategory(formData);
      }
      closeModal();
      await fetchCategories();
    } catch {
      setError('Failed to save category');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (category: Category) => {
    if (
      !window.confirm(
        `Delete ${category.name}? Products using it will become uncategorized.`,
      )
    ) {
      return;
    }

    setDeletingCategoryId(category.id);
    try {
      await categoryService.deleteCategory(category.id);
      await fetchCategories();
    } catch {
      setError('Failed to delete category');
    } finally {
      setDeletingCategoryId(null);
    }
  };

  const filteredCategories = categories.filter(category =>
    `${category.name} ${category.description || ''}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg text-slate-600">Loading categories...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
            Categories
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Organize products with categories for your business.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="w-full rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 px-4 py-3 font-semibold text-white transition hover:from-amber-600 hover:to-amber-700 sm:w-auto"
        >
          Add Category
        </button>
      </div>

      {error && !showModal && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white p-6 shadow-lg shadow-slate-900/5">
          <p className="text-sm font-medium text-slate-500">Total Categories</p>
          <p className="mt-3 text-2xl font-bold text-slate-950">
            {categories.length}
          </p>
        </div>
        <div className="rounded-3xl border border-white/10 bg-white p-6 shadow-lg shadow-slate-900/5">
          <p className="text-sm font-medium text-slate-500">
            Categorized Products
          </p>
          <p className="mt-3 text-2xl font-bold text-slate-950">
            {categories.reduce(
              (total, category) => total + Number(category.product_count || 0),
              0,
            )}
          </p>
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white p-4 shadow-lg shadow-slate-900/5 sm:p-6">
        <input
          type="text"
          placeholder="Search categories..."
          value={searchTerm}
          onChange={event => setSearchTerm(event.target.value)}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20"
        />
      </div>

      <div className="overflow-hidden rounded-3xl border border-white/10 bg-white shadow-lg shadow-slate-900/5">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Name
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Description
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Products
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCategories.length > 0 ? (
                filteredCategories.map(category => (
                  <tr
                    key={category.id}
                    className="transition hover:bg-slate-50/70"
                  >
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-950">
                      {category.name}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {category.description || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                      {category.product_count || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => openEditModal(category)}
                        className="mr-2 rounded-xl bg-slate-900 px-3 py-2 text-sm text-white transition hover:bg-slate-700"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(category)}
                        disabled={deletingCategoryId === category.id}
                        className="rounded-xl bg-rose-600 px-3 py-2 text-sm text-white transition hover:bg-rose-500 disabled:opacity-60"
                      >
                        {deletingCategoryId === category.id ? (
                          <span className="flex items-center justify-center gap-2">
                            <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            Deleting...
                          </span>
                        ) : (
                          'Delete'
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-10 text-center text-slate-600"
                  >
                    No categories found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={showModal}
        onClose={closeModal}
        title={editingCategory ? 'Edit Category' : 'Add Category'}
      >
        {error && (
          <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            {error}
          </div>
        )}
        <div className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Name
            </label>
            <input
              type="text"
              maxLength={100}
              value={formData.name}
              onChange={event =>
                setFormData({ ...formData, name: event.target.value })
              }
              placeholder="e.g. Beverages"
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20"
            />
          </div>
          <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={event =>
                setFormData({ ...formData, description: event.target.value })
              }
              placeholder="Optional description"
              rows={4}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-950 outline-none transition focus:border-amber-500 focus:bg-white focus:ring-2 focus:ring-amber-500/20"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={closeModal}
              disabled={isSubmitting}
              className="rounded-xl border border-slate-200 bg-slate-50 px-6 py-2 font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-2 font-semibold text-white transition hover:from-amber-600 hover:to-amber-700 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Saving...
                </span>
              ) : editingCategory ? (
                'Update Category'
              ) : (
                'Add Category'
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Categories;
