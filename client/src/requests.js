import {
    ApolloClient, ApolloLink, HttpLink, InMemoryCache, split
} from '@apollo/client';
import gql from 'graphql-tag';
import { getAccessToken } from "./auth";

const httpUrl = 'http://localhost:9000/graphql'

const httpLink = ApolloLink.from([
    new ApolloLink((operation, forward) => {
        const token = getAccessToken();
        if (token) {
            operation.setContext({headers: {'authorization': `Bearer ${token}`}});
        }
        return forward(operation);
    }),
    new HttpLink({uri: httpUrl})
]);

const client = new ApolloClient({
    link: httpLink,
    cache: new InMemoryCache()
});

const jobDetailFragment = gql`
    fragment JobDetail on Job {
        id
        title
        description
        company {
            id
            name
        }
    }
`;

const jobQuery = gql`
    query JobQuery($id: ID!) {
        job(id: $id) { ...JobDetail }
    }
    ${jobDetailFragment}
`;

const jobsQuery = gql`
    query JobsQuery {
        jobs {
            id
            title
            company {
                id
                name
            }
        }
    }
`;

const createJobMutation = gql`
    mutation CreateJob($input: CreateJobInput) {
        job: createJob(input: $input) { ...JobDetail }
    }
    ${jobDetailFragment}
`;

const companyQuery = gql`
    query CompanyQuery($id: ID!) {
        company(id: $id) {
            id
            name
            description
            jobs {
                id
                title
            }
        }
    }
`;

export async function loadJob(id) {
    const {data} = await client.query({query: jobQuery, variables: {id}});
    return data.job;
}

export async function loadJobs() {
    const {data} = await client.query({query: jobsQuery, fetchPolicy: 'no-cache'});
    /* 
        Cache options
            -- cache-first; if not in cache, make call; default
            -- no-cache; always fetch data from server
    */
    return data.jobs;
}

export async function loadCompany(id) {
    const {data} = await client.query({query: companyQuery, variables: {id}});
    return data.company;
}

export async function createJob(input) {
    const {data: {job}} = await client.mutate({
        mutation: createJobMutation, 
        variables: {input},
        update: (cache, {data}) => { // Called after the mutation to directly add item into the cache
            cache.writeQuery({
                query: jobQuery, // The query we're trying to update our cache for
                variables: {id: data.job.id}, // Where id is the id of the job to be cached
                data: data // Where data is the data that was returned upon insertion
            });
        }
    });
    return job;
}