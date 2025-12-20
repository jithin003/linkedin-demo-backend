const axios = require('axios');

class JobsService {
    constructor() {
        this.arbeitnowUrl = 'https://www.arbeitnow.com/api/job-board-api';
        this.remoteOkUrl = 'https://remoteok.com/api';
    }

    async getJobs(page = 1) {
        try {
            // Try Arbeitnow first
            const response = await axios.get(this.arbeitnowUrl, {
                timeout: 5000
            });

            if (response.data && response.data.data) {
                return this.formatArbeitnowJobs(response.data.data);
            }
        } catch (error) {
            console.log('Arbeitnow API failed, trying RemoteOK:', error.message);
        }

        // Fallback to RemoteOK
        try {
            const response = await axios.get(this.remoteOkUrl, {
                timeout: 5000
            });

            if (response.data && Array.isArray(response.data)) {
                return this.formatRemoteOkJobs(response.data.slice(1, 21)); // Skip first item (metadata)
            }
        } catch (error) {
            console.error('RemoteOK API failed:', error.message);
            throw new Error('Failed to fetch jobs from all sources');
        }
    }

    async searchJobs(query) {
        try {
            const jobs = await this.getJobs();

            if (!query) return jobs;

            const lowerQuery = query.toLowerCase();
            return jobs.filter(job =>
                job.title.toLowerCase().includes(lowerQuery) ||
                job.company.toLowerCase().includes(lowerQuery) ||
                job.description.toLowerCase().includes(lowerQuery) ||
                (job.tags && job.tags.some(tag => tag.toLowerCase().includes(lowerQuery)))
            );
        } catch (error) {
            throw error;
        }
    }

    formatArbeitnowJobs(jobs) {
        return jobs.map(job => ({
            id: job.slug || `arbeit-${Date.now()}-${Math.random()}`,
            title: job.title,
            company: job.company_name,
            location: job.location || 'Remote',
            description: job.description || '',
            url: job.url,
            tags: job.tags || [],
            jobType: job.job_types?.[0] || 'Full-time',
            remote: job.remote || false,
            createdAt: job.created_at,
            source: 'arbeitnow'
        }));
    }

    formatRemoteOkJobs(jobs) {
        return jobs.map(job => ({
            id: job.id || `remote-${Date.now()}-${Math.random()}`,
            title: job.position,
            company: job.company,
            location: job.location || 'Remote',
            description: job.description || '',
            url: job.url,
            tags: job.tags || [],
            jobType: job.type || 'Full-time',
            remote: true,
            createdAt: new Date(job.date * 1000).toISOString(),
            source: 'remoteok',
            logo: job.company_logo
        }));
    }
}

module.exports = new JobsService();
