'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Activity,
  Shield,
  Zap,
  BarChart3,
  Bell,
  Download,
  ArrowRight,
  CheckCircle,
  Globe,
  Lock,
  Sparkles,
} from 'lucide-react';
import { AppLayout } from './components/layout/AppLayout';
import { Button, Card, CardContent } from './components/ui';
import { cn } from './lib/utils';

const features = [
  {
    icon: Activity,
    title: 'Real-time Monitoring',
    description: 'Track authentication events as they happen with instant updates and live dashboards.',
    gradient: 'from-violet-500 to-purple-500',
  },
  {
    icon: Shield,
    title: 'Secure Integration',
    description: 'Built-in support for Clerk webhooks with Svix signature verification.',
    gradient: 'from-blue-500 to-cyan-500',
  },
  {
    icon: BarChart3,
    title: 'Advanced Analytics',
    description: 'Visualize trends, track user activity, and generate comprehensive reports.',
    gradient: 'from-emerald-500 to-teal-500',
  },
  {
    icon: Download,
    title: 'Excel Export',
    description: 'Export filtered events to Excel for further analysis and compliance reporting.',
    gradient: 'from-orange-500 to-amber-500',
  },
  {
    icon: Bell,
    title: 'Smart Notifications',
    description: 'Get alerted on suspicious activities and important authentication events.',
    gradient: 'from-pink-500 to-rose-500',
  },
  {
    icon: Globe,
    title: 'Multi-App Support',
    description: 'Monitor multiple applications from a single, unified dashboard.',
    gradient: 'from-indigo-500 to-blue-500',
  },
];

const steps = [
  {
    number: '01',
    title: 'Create an Application',
    description: 'Add your application to start receiving authentication events from Clerk webhooks.',
    icon: Sparkles,
  },
  {
    number: '02',
    title: 'Configure Webhooks',
    description: 'Copy the generated webhook URL and add it to your Clerk dashboard.',
    icon: Lock,
  },
  {
    number: '03',
    title: 'Monitor Events',
    description: 'View real-time authentication events, analyze trends, and export data.',
    icon: Activity,
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function Home() {
  return (
    <AppLayout>
      <div className="min-h-screen">
        {/* Hero Section */}
        <section className="relative overflow-hidden px-6 py-20 lg:py-32">
          {/* Background decorations */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl" />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-6xl mx-auto text-center"
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 mb-8"
            >
              <Sparkles className="w-4 h-4 text-violet-500" />
              <span className="text-sm font-medium text-violet-600 dark:text-violet-400">
                Powered by Clerk & Svix
              </span>
            </motion.div>

            {/* Main heading */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl sm:text-5xl lg:text-7xl font-bold tracking-tight mb-6"
            >
              <span className="text-gray-900 dark:text-white">Monitor Your</span>
              <br />
              <span className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                Authentication Events
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-10"
            >
              Track, analyze, and export authentication events across all your applications
              with real-time dashboards and powerful analytics.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link href="/applications">
                <Button variant="gradient" size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
                  Get Started
                </Button>
              </Link>
              <Link href="/events">
                <Button variant="default" size="lg" leftIcon={<Activity className="w-5 h-5" />}>
                  View Events
                </Button>
              </Link>
            </motion.div>

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="grid grid-cols-3 gap-8 max-w-xl mx-auto mt-16"
            >
              {[
                { label: 'Events Tracked', value: '∞' },
                { label: 'Apps Supported', value: '∞' },
                { label: 'Export Formats', value: 'Excel' },
              ].map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </motion.div>
        </section>

        {/* Features Section */}
        <section className="px-6 py-20 bg-gray-50/50 dark:bg-[#0c0e12]">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Everything You Need
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Comprehensive authentication monitoring with powerful features for modern applications.
              </p>
            </motion.div>

            <motion.div
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {features.map((feature, index) => (
                <motion.div key={index} variants={itemVariants}>
                  <Card variant="glass" className="h-full">
                    <CardContent className="p-6">
                      <div
                        className={cn(
                          'w-12 h-12 rounded-xl flex items-center justify-center mb-4',
                          `bg-gradient-to-br ${feature.gradient}`,
                          'shadow-lg'
                        )}
                      >
                        <feature.icon className="w-6 h-6 text-white" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        {feature.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="px-6 py-20">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Get Started in Minutes
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
                Three simple steps to start monitoring your authentication events.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {steps.map((step, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.2 }}
                  className="relative"
                >
                  {/* Connector line */}
                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute top-16 left-full w-full h-0.5 bg-gradient-to-r from-violet-500/50 to-transparent -translate-x-1/2" />
                  )}

                  <div className="relative z-10 text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white text-2xl font-bold mb-6 shadow-lg shadow-violet-500/25">
                      {step.number}
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">
                      {step.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">{step.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mt-12"
            >
              <Link href="/applications">
                <Button variant="primary" size="lg" rightIcon={<ArrowRight className="w-5 h-5" />}>
                  Create Your First Application
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="px-6 py-12 border-t border-gray-200 dark:border-gray-800">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                AuthLogger
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              © {new Date().getFullYear()} NextStep Software Solutions Inc. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
    </AppLayout>
  );
}
