'use client';

import { useState, useEffect } from 'react';
import { createApplication, getApplications, updateApplication, deleteApplication } from './actions';
import Link from 'next/link';

interface Application {
    id: string;
    name: string;
    description: string | null;
    createdAt: Date;
}

export default function ApplicationsPage() {
    const [applications, setApplications] = useState<Application[]>([]);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editDescription, setEditDescription] = useState('');

    useEffect(() => {
        fetchApplications();
    }, []);

    const fetchApplications = async () => {
        try {
            const result = await getApplications();
            if (result.success && result.applications) {
                setApplications(result.applications);
            } else {
                console.error('Error fetching applications:', result.error);
            }
        } catch (error) {
            console.error('Error fetching applications:', error);
        }
    };

    const handleSubmit = async (formData: FormData) => {
        setLoading(true);
        setError('');

        try {
            const result = await createApplication(formData);
            if (result.success && result.application) {
                setApplications([result.application, ...applications]);
                setName('');
                setDescription('');
            } else {
                setError(result.error || 'Failed to create application');
            }
        } catch (error) {
            setError('Network error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (app: Application) => {
        setEditingId(app.id);
        setEditName(app.name);
        setEditDescription(app.description || '');
    };

    const handleUpdate = async (formData: FormData) => {
        setLoading(true);
        setError('');

        try {
            const result = await updateApplication(formData);
            if (result.success && result.application) {
                setApplications(applications.map(app =>
                    app.id === result.application.id ? result.application : app
                ));
                setEditingId(null);
                setEditName('');
                setEditDescription('');
            } else {
                setError(result.error || 'Failed to update application');
            }
        } catch (error) {
            setError('Network error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (appId: string) => {
        if (!confirm('Are you sure you want to delete this application?')) {
            return;
        }

        setLoading(true);
        setError('');

        try {
            const formData = new FormData();
            formData.append('id', appId);

            const result = await deleteApplication(formData);
            if (result.success) {
                setApplications(applications.filter(app => app.id !== appId));
            } else {
                setError(result.error || 'Failed to delete application');
            }
        } catch (error) {
            setError('Network error occurred');
        } finally {
            setLoading(false);
        }
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditName('');
        setEditDescription('');
    };

    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Applications</h1>
                <div className="flex gap-4">
                    <Link
                        href="/events"
                        className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                        View Events →
                    </Link>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                <h2 className="text-xl font-semibold mb-4">Create New Application</h2>
                <form action={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                            Application Name *
                        </label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    {error && (
                        <div className="text-red-600 text-sm">{error}</div>
                    )}
                    <button
                        type="submit"
                        disabled={loading}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                        {loading ? 'Creating...' : 'Create Application'}
                    </button>
                </form>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold mb-4">Existing Applications</h2>
                {applications.length === 0 ? (
                    <p className="text-gray-500">No applications created yet.</p>
                ) : (
                    <div className="space-y-4">
                        {applications.map((app) => (
                            <div key={app.id} className="border border-gray-200 rounded-lg p-4">
                                {editingId === app.id ? (
                                    <form action={handleUpdate} className="space-y-4">
                                        <input type="hidden" name="id" value={app.id} />
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Application Name *
                                            </label>
                                            <input
                                                type="text"
                                                name="name"
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Description
                                            </label>
                                            <textarea
                                                name="description"
                                                value={editDescription}
                                                onChange={(e) => setEditDescription(e.target.value)}
                                                rows={2}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                type="submit"
                                                disabled={loading}
                                                className="bg-green-600 text-white px-3 py-1 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 text-sm"
                                            >
                                                {loading ? 'Saving...' : 'Save'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={cancelEdit}
                                                className="bg-gray-600 text-white px-3 py-1 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 text-sm"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    <>
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-medium text-lg">{app.name}</h3>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleEdit(app)}
                                                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(app.id)}
                                                    className="text-red-600 hover:text-red-800 text-sm font-medium"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                        {app.description && (
                                            <p className="text-gray-600 mt-1">{app.description}</p>
                                        )}
                                        <p className="text-sm text-gray-500 mt-2">
                                            Created: {new Date(app.createdAt).toLocaleDateString()}
                                        </p>
                                        <p className="text-sm text-gray-400 mt-1">
                                            Webhook URL: {typeof window !== 'undefined' ? window.location.origin : ''}/api/webhook/{app.name}
                                        </p>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
