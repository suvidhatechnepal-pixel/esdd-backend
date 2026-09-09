// Kept in sync with DEFAULT_CHECKLIST in esdd-risk-console.html.
// If you edit questions in the Admin screen once the app is live, that edit is
// saved as a new row in checklist_versions - this file only seeds the first one.
module.exports = {
  sections: [
    {
      id: 's1', name: 'General Risks',
      questions: [
        { id: '1.1', text: "Are there any legal issues associated with the client's E&S performance?", exclude: false,
          options: {
            a: "Client has all valid permits AND has not faced any legal claims or any serious environmental/social incident in last three years",
            b: "Client does not have all valid permits but has taken definite steps to acquire them in next six months AND/OR client has faced legal claims but has addressed or has a definite plan to address all of them",
            c: "Client does not have all valid permits and has not taken any definite step to acquire them AND/OR client has faced legal claims and has no definite plan to address them",
            d: "Not applicable"
          }},
        { id: '1.2', text: "Have operations ever been affected by local stakeholder grievances, media or non-governmental organization (NGO) campaigns over E&S issues?", exclude: false,
          options: {
            a: "There is no evidence of stakeholder grievances, negative media or NGO protest",
            b: "There is evidence of stakeholder grievances, negative media or NGO protest for a particular operation AND client has taken adequate steps to address the issue",
            c: "There is evidence of stakeholder grievances, negative media or NGO protest and client has not taken any step to address the issue",
            d: "Not applicable"
          }},
        { id: '1.3', text: "Is the project site and/or its routing likely to have negative impacts on sensitive areas (residential or protected sites) near the project site?", exclude: false,
          options: {
            a: "No sensitive areas observed",
            b: "There are a few sensitive areas AND the client has taken adequate measures to mitigate the impact of their operation on the sensitive areas as per regulations",
            c: "There are sensitive areas observed and mitigation measures are not adequate as per regulations and the client may face legal challenge in future",
            d: "Not applicable"
          }},
        { id: '1.4', text: "Is the project involved or will involve acquiring land with resettlement?", exclude: false,
          options: {
            a: "Neither land acquisition nor involuntary resettlement observed",
            b: "There is land acquisition and voluntary resettlement and the client has taken adequate measures as per regulations to mitigate the negative impacts of displacement, to identify development opportunities for all affected persons",
            c: "There is land acquisition and involuntary resettlement and the client has not taken adequate measure as per regulations and the client may face legal challenge in future",
            d: "Not applicable"
          }}
      ]
    },
    {
      id: 's2', name: 'Environmental Health and Safety Risks',
      questions: [
        { id: '2.1', text: "Is there any evidence of air and noise pollution from the client's operation violating the Environment Protection Rules or the conditions specified in the client's Pollution Control Certificate?", exclude: false,
          options: {
            a: "There is no evidence of air/noise pollution and non-compliance and/or all mitigation measures and monitoring systems are in place",
            b: "There is evidence of air/noise emission and non-compliance AND partial mitigation measure/monitoring system is in place AND client is addressing or has a definite plan to address the remaining issues",
            c: "There is evidence of air emission/noise and non-compliance AND there is no mitigation measure/monitoring system in place AND client has no definite plan to address the issues",
            d: "Not applicable"
          }},
        { id: '2.2', text: "Is there any evidence of water pollution due to the client's operation, violating the Environment Protection Rules or the conditions specified in the client's Pollution Control Certificate?", exclude: false,
          options: {
            a: "There is no evidence of water pollution and non-compliance and/or all mitigation measures and monitoring systems are in place",
            b: "There is evidence of water pollution and non-compliance AND partial mitigation measure/monitoring system is in place AND client is addressing or has a definite plan to address the remaining issues",
            c: "There is evidence of water pollution and non-compliance AND there is no mitigation measure/monitoring system in place AND client has no definite plan to address the issues",
            d: "Not applicable"
          }},
        { id: '2.3', text: "Is there any evidence of land pollution and lack of waste handling mechanism in the project operation violating the Environment Protection Rules or the conditions specified in the client's Pollution Control Certificate?", exclude: false,
          options: {
            a: "There is no evidence of land contamination or lack of waste handling mechanism or non-compliance OR all mitigation measures and monitoring systems are in place",
            b: "There is evidence of land contamination or lack of waste handling mechanism or non-compliance AND partial mitigation measure/monitoring system is in place AND client is addressing or has a definite plan to address the remaining issues",
            c: "There is evidence of land contamination or lack of waste handling mechanism or non-compliance AND there is no mitigation measure/monitoring system in place AND client has no definite plan to address the issues",
            d: "Not applicable"
          }},
        { id: '2.4', text: "Has the client made any investments in technologies or measures leading to cost savings by reducing energy consumption (energy efficiency) or using renewable energy (solar, wind, mini-hydropower, organic fuel)?", exclude: true,
          options: {
            a: "The client made investment in energy efficiency technologies/measures OR in renewable energy generation OR analyzed its operation from an energy-efficiency standpoint (e.g. energy audit) and is actively pursuing opportunities for energy-related cost savings",
            b: "The client is considering identifying opportunities for cost savings from improved energy efficiency or renewable energy use but has not made any particular steps in this direction yet",
            c: "The client has never made any investment in technologies or measures for energy-related cost savings and appears to be unaware of the opportunities in this area",
            d: "Not applicable"
          }},
        { id: '2.5', text: "Are there any Climate Change related risks (flood, drought, cyclone, etc.) and opportunities (GHG emission reduction) associated with the client's operation?", exclude: false,
          options: {
            a: "Client has a robust disaster management plan to combat climatic risks AND client has procedures in place to measure, disclose, set targets and mitigate its GHG emissions",
            b: "Client has a disaster management plan but it is not robust AND there is evidence that client has intention to measure, disclose, set targets and mitigate its GHG emissions in near future",
            c: "No disaster management plan AND no definite plan to measure, disclose, set targets and mitigate its GHG emissions in future",
            d: "Not applicable"
          }}
      ]
    },
    {
      id: 's3', name: 'Social Risks',
      questions: [
        { id: '3.1', text: "Is there any evidence of increased fire risk or occupational health & safety (OHS) risk, i.e. risk of injuries at work?", exclude: false,
          options: {
            a: "The client does not have any OHS concern or has mitigated them adequately",
            b: "The client has some OHS concern but has taken definite steps to correct them",
            c: "The client has OHS concern in its operation and has no plan of correcting them",
            d: "Not applicable"
          }},
        { id: '3.2', text: "Are the labor and working conditions poor and breaching local regulations/standards?", exclude: false,
          options: {
            a: "There is proper working condition and labor practice AND there is no evidence of poor working condition or labor practice for which client may face legal challenge, labor unrest, negative media coverage or protest from activists",
            b: "There are a few evidences of poor working conditions BUT no significantly poor labor practice such as child/forced labor is present AND the client has a definite plan to improve working conditions",
            c: "Working conditions are very poor AND/OR there is presence of significantly poor labor practice such as child/forced labor AND client is not addressing/has no definite plan to address the issues",
            d: "Not applicable"
          }},
        { id: '3.3', text: "Does the project pose a threat to Community Health, Safety and Security?", exclude: false,
          options: {
            a: "There is no evidence of issues that may create nuisance/accidents/injuries to the local community, or the company has a robust plan for community health & safety developed in consultation with the local community",
            b: "There are a few evidences of issues that may create nuisance/accidents/injuries to the local community AND the client intends to address the gaps AND/OR has a plan for community health & safety, but it is not robust or not developed in consultation with the community",
            c: "There is evidence of significant issues that can create nuisance/accidents/injuries to the local community AND client has no definite plan to address the gaps AND/OR does not intend to manage its impact on community health & safety",
            d: "Not applicable"
          }},
        { id: '3.4', text: "Is there any evidence of community consultation with key stakeholders including indigenous people and local community?", exclude: false,
          options: {
            a: "There is evidence that the client consults/engages with the stakeholders including local community, indigenous people (such as rehabilitation, compensation, their expectations as the case may be)",
            b: "There is limited/inadequate consultation with the stakeholders",
            c: "No consultation with the stakeholders",
            d: "Not applicable"
          }}
      ]
    }
  ]
};
