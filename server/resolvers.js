const db = require('./db');
require('./config');
const { PubSub } = require('graphql-subscriptions');
const { 
    JobModel,
    CompanyModel
 } = require('./models');

 const JOB_ADDED = 'JOB_ADDED';

const pubSub = new PubSub();

const Query = {
    // This should mirror what we have in the 'Query' type inside our schema file
    job: async (root, args) => await JobModel.findOne({id: args.id}),
    jobs: async () => await JobModel.find({}),
    company: async (root, args) => await CompanyModel.findOne({id: args.id})
};

const Mutation = {
    createJob: async (root, {input}, context) => {
        const user = context.user;
        // Check user auth
        console.log(context)
        if(!user) {
            throw new Error('Unauthorized');
        }
        // In our schema, we specified that this mutation should return Job
        const job = await JobModel.create({
            ...input,
            id: Math.random().toString(),
            companyId: user.companyId
        });
        pubSub.publish(JOB_ADDED, {jobAdded: job});
        return job;
    }
}

const Subscription = {
    jobAdded: {
      subscribe: (_root, _args, {userId}) => {
        requireAuth(userId); // This line here will secure our WebSocket transmissions
        return pubSub.asyncIterator(MESSAGE_ADDED);
      }
    }
};

const Company = {
    // Return the jobs whose companyId is the same as the id for this company
    jobs: async (company) => await JobModel.find({companyId: company.id})
}

const Job = {
    // Return the company whose ID is the same as the company ID for this job
    company: async (job) => await CompanyModel.findOne({id: job.companyId})
}

module.exports = { 
    Query,
    Mutation,
    Subscription,
    Company,
    Job 
};