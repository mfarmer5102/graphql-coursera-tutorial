import React, { Component, useEffect, useState } from 'react';
import { loadCompany } from './requests';
import JobList from './JobList';

const CompanyDetail = ({match}) => {
  const [company, setCompany] = useState({jobs: []});

  useEffect(() => {
    loadCompany(match.params.companyId).then((company) => {
      console.log(company)
      setCompany(company);
    });
  }, []);

  if (!company) return null;
  return (
    <div>
      <h1 className="title">{company.name}</h1>
      <div className="box">{company.description}</div>
      <h5 className="title is-5">Jobs at {company.name}</h5>
      <JobList jobs={company.jobs} />
    </div>
  );

}

export default CompanyDetail;