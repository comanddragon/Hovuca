import { motion } from "framer-motion";
import { Heart, Users, Globe, TrendingUp } from "lucide-react";

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.5 } },
};

const stats = {
    total_projects: 25,
    active_projects: 12,
    completed_projects: 13,
    total_raised: 250000,
};

const statItems = [
    {
        icon: Globe,
        value: `${stats.total_projects}+`,
        label: "Projects Launched",
        gradient: "from-[hsl(160,84%,39%)] to-[hsl(177,70%,41%)]", // emerald-green → ocean-teal
    },
    {
        icon: TrendingUp,
        value: stats.active_projects,
        label: "Active Projects",
        gradient: "from-[hsl(217,91%,60%)] to-[hsl(262,83%,58%)]", // electric-blue → bright-purple
    },
    {
        icon: Users,
        value: "50K+",
        label: "Lives Impacted",
        gradient: "from-[hsl(262,83%,58%)] to-[hsl(327,73%,64%)]", // bright-purple → hot-pink
    },
    {
        icon: Heart,
        value: `$${Math.round(stats.total_raised / 1000)}K`,
        label: "Funds Raised",
        gradient: "from-[hsl(25,95%,53%)] to-[hsl(14,83%,64%)]", // sunny-orange → coral-pink
    },
];

export default function Stats() {
    return (
        <section className="py-16 md:py-24 bg-white">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl">
                <motion.div
                    className="grid grid-cols-2 md:grid-cols-4 gap-6"
                    variants={containerVariants}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true }}
                >
                    {statItems.map(({ icon: Icon, value, label, gradient }, i) => (
                        <motion.div
                            key={label}
                            variants={itemVariants}
                            whileHover={{ y: -5, scale: 1.02 }}
                            className={`bg-gradient-to-br ${gradient} rounded-lg p-6 text-center text-white shadow-lg`}
                        >
                            <div className="flex items-center justify-center mb-4">
                                <Icon className="w-8 h-8 text-white/80" />
                            </div>
                            <motion.div
                                className="text-3xl md:text-4xl font-semibold text-white mb-2 tracking-tight"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: i * 0.05 }}
                            >
                                {value}
                            </motion.div>
                            <div className="text-sm font-light text-white/80">{label}</div>
                        </motion.div>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}