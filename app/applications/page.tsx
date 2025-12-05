'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus,
    Edit2,
    Trash2,
    Copy,
    Check,
    AppWindow,
    Calendar,
    Link as LinkIcon,
} from 'lucide-react';
import { createApplication, getApplications, updateApplication, deleteApplication } from './actions';
import { AppLayout } from '../components/layout/AppLayout';
import {
    Button,
    Card,
    CardContent,
    Input,
    Textarea,
    Modal,
    ConfirmModal,
    EmptyState,
    SkeletonCard,
    useToast,
} from '../components/ui';
import { useCopyToClipboard } from '../lib/hooks';
import { cn, formatDate } from '../lib/utils';

interface Application {
    id: string;
    name: string;
    description: string | null;
    createdAt: Date;
}

export default function ApplicationsPage() {
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedApp, setSelectedApp] = useState<Application | null>(null);
    const [formLoading, setFormLoading] = useState(false);

    // Form states
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [formError, setFormError] = useState('');

    const toast = useToast();
    const { copy, copied } = useCopyToClipboard();

    useEffect(() => {
        fetchApplications();
    }, []);

    const fetchApplications = async () => {
        try {
            setLoading(true);
            const result = await getApplications();
            if (result.success && result.data) {
                setApplications(result.data);
            } else {
                toast.error(result.error || 'Failed to load applications');
            }
        } catch {
            toast.error('Network error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!name.trim()) {
            setFormError('Application name is required');
            return;
        }

        setFormLoading(true);
        setFormError('');

        try {
            const formData = new FormData();
            formData.append('name', name);
            formData.append('description', description);

            const result = await createApplication(formData);
            if (result.success && result.data) {
                setApplications([result.data, ...applications]);
                setIsCreateModalOpen(false);
                setName('');
                setDescription('');
                toast.success('Application created successfully');
            } else {
                setFormError(result.error || 'Failed to create application');
            }
        } catch {
            setFormError('Network error occurred');
        } finally {
            setFormLoading(false);
        }
    };

    const handleEdit = async () => {
        if (!selectedApp || !name.trim()) {
            setFormError('Application name is required');
            return;
        }

        setFormLoading(true);
        setFormError('');

        try {
            const formData = new FormData();
            formData.append('id', selectedApp.id);
            formData.append('name', name);
            formData.append('description', description);

            const result = await updateApplication(formData);
            if (result.success && result.data) {
                setApplications(applications.map(app =>
                    app.id === result.data!.id ? result.data! : app
                ));
                setIsEditModalOpen(false);
                setSelectedApp(null);
                setName('');
                setDescription('');
                toast.success('Application updated successfully');
            } else {
                setFormError(result.error || 'Failed to update application');
            }
        } catch {
            setFormError('Network error occurred');
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedApp) return;

        setFormLoading(true);

        try {
            const formData = new FormData();
            formData.append('id', selectedApp.id);

            const result = await deleteApplication(formData);
            if (result.success) {
                setApplications(applications.filter(app => app.id !== selectedApp.id));
                setIsDeleteModalOpen(false);
                setSelectedApp(null);
                toast.success('Application deleted successfully');
            } else {
                toast.error(result.error || 'Failed to delete application');
            }
        } catch {
            toast.error('Network error occurred');
        } finally {
            setFormLoading(false);
        }
    };

    const openEditModal = (app: Application) => {
        setSelectedApp(app);
        setName(app.name);
        setDescription(app.description || '');
        setFormError('');
        setIsEditModalOpen(true);
    };

    const openDeleteModal = (app: Application) => {
        setSelectedApp(app);
        setIsDeleteModalOpen(true);
    };

    const getWebhookUrl = (appName: string) => {
        if (typeof window !== 'undefined') {
            return `${window.location.origin}/api/webhook/${appName}`;
        }
        return `/api/webhook/${appName}`;
    };

    const handleCopyWebhook = (appName: string) => {
        copy(getWebhookUrl(appName));
        toast.success('Webhook URL copied to clipboard');
    };

    return (
        <AppLayout>
            <div className="max-w-6xl mx-auto px-6 py-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div>
                        <motion.h1
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-3xl font-bold text-gray-900 dark:text-white"
                        >
                            Applications
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="text-gray-600 dark:text-gray-300 mt-1"
                        >
                            Manage your applications and webhook endpoints
                        </motion.p>
                    </div>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.2 }}
                    >
                        <Button
                            variant="primary"
                            leftIcon={<Plus className="w-4 h-4" />}
                            onClick={() => {
                                setName('');
                                setDescription('');
                                setFormError('');
                                setIsCreateModalOpen(true);
                            }}
                        >
                            New Application
                        </Button>
                    </motion.div>
                </div>

                {/* Applications Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[...Array(3)].map((_, i) => (
                            <SkeletonCard key={i} />
                        ))}
                    </div>
                ) : applications.length === 0 ? (
                    <Card variant="glass" className="py-16">
                        <EmptyState
                            icon={<AppWindow className="w-12 h-12" />}
                            title="No applications yet"
                            description="Create your first application to start receiving authentication events."
                            action={
                                <Button
                                    variant="primary"
                                    leftIcon={<Plus className="w-4 h-4" />}
                                    onClick={() => setIsCreateModalOpen(true)}
                                >
                                    Create Application
                                </Button>
                            }
                        />
                    </Card>
                ) : (
                    <motion.div
                        initial="hidden"
                        animate="visible"
                        variants={{
                            visible: {
                                transition: { staggerChildren: 0.1 },
                            },
                        }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        <AnimatePresence mode="popLayout">
                            {applications.map((app) => (
                                <motion.div
                                    key={app.id}
                                    layout
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9 }}
                                    whileHover={{ y: -4 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <Card variant="glass" className="h-full">
                                        <CardContent className="p-6">
                                            {/* Header */}
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
                                                        <AppWindow className="w-6 h-6 text-white" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-semibold text-gray-900 dark:text-white">
                                                            {app.name}
                                                        </h3>
                                                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-300">
                                                            <Calendar className="w-3 h-3" />
                                                            {formatDate(app.createdAt)}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-1">
                                                    <button
                                                        onClick={() => openEditModal(app)}
                                                        className="p-2 rounded-lg text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                                    >
                                                        <Edit2 className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => openDeleteModal(app)}
                                                        className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Description */}
                                            {app.description && (
                                                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                                                    {app.description}
                                                </p>
                                            )}

                                            {/* Webhook URL */}
                                            <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-700/50">
                                                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-300 mb-2">
                                                    <LinkIcon className="w-3 h-3" />
                                                    Webhook URL
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <code className="flex-1 text-xs bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-lg truncate font-mono">
                                                        {getWebhookUrl(app.name)}
                                                    </code>
                                                    <button
                                                        onClick={() => handleCopyWebhook(app.name)}
                                                        className={cn(
                                                            'p-2 rounded-lg transition-colors',
                                                            copied
                                                                ? 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                                                                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800'
                                                        )}
                                                    >
                                                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                                    </button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>
                )}

                {/* Create Modal */}
                <Modal
                    isOpen={isCreateModalOpen}
                    onClose={() => setIsCreateModalOpen(false)}
                    title="Create New Application"
                    description="Add a new application to start receiving authentication events."
                >
                    <div className="space-y-4">
                        <Input
                            label="Application Name"
                            placeholder="My Awesome App"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            error={formError}
                        />
                        <Textarea
                            label="Description (optional)"
                            placeholder="Brief description of your application..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                        />
                        <div className="flex gap-3 pt-4">
                            <Button
                                variant="secondary"
                                className="flex-1"
                                onClick={() => setIsCreateModalOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                className="flex-1"
                                onClick={handleCreate}
                                isLoading={formLoading}
                            >
                                Create
                            </Button>
                        </div>
                    </div>
                </Modal>

                {/* Edit Modal */}
                <Modal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    title="Edit Application"
                >
                    <div className="space-y-4">
                        <Input
                            label="Application Name"
                            placeholder="My Awesome App"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            error={formError}
                        />
                        <Textarea
                            label="Description (optional)"
                            placeholder="Brief description of your application..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                        />
                        <div className="flex gap-3 pt-4">
                            <Button
                                variant="secondary"
                                className="flex-1"
                                onClick={() => setIsEditModalOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                className="flex-1"
                                onClick={handleEdit}
                                isLoading={formLoading}
                            >
                                Save Changes
                            </Button>
                        </div>
                    </div>
                </Modal>

                {/* Delete Confirmation Modal */}
                <ConfirmModal
                    isOpen={isDeleteModalOpen}
                    onClose={() => setIsDeleteModalOpen(false)}
                    onConfirm={handleDelete}
                    title="Delete Application"
                    message={`Are you sure you want to delete "${selectedApp?.name}"? This action cannot be undone and all associated events will be lost.`}
                    confirmText="Delete"
                    variant="danger"
                    isLoading={formLoading}
                />
            </div>
        </AppLayout>
    );
}
