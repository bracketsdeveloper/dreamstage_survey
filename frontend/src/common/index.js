const Backend = process.env.REACT_APP_BACKEND_URL

const SummaryApi = {
    Login: {
        url: `${Backend}/api/login`,
        method: "post"
    },
    Register: {
        url: `${Backend}/api/register`,
        method: "post"
    },
    GetQuestions: {
         url: `${Backend}/api/questions`,
         method: "get" 
    },
    AddQuestion: {
         url: `${Backend}/api/questions`, 
         method: "post" 
    },
    ReorderQuestions: { 
        url: `${Backend}/api/questions/reorder`, 
        method: "put" 
    },
    UpdateQuestion: (id) => ({
         url: `${Backend}/api/questions/${id}`, 
         method: "put" 
    }),
    GetAllAnswers: {
        url: `${Backend}/api/answers`,
        method: "get",
    },
    GetAnswerByPhone: (phone) => ({
        url: `${Backend}/api/answers/${phone}`,
        method: "get",
    }),
    MarkViewed: (phone) => ({
        url: `${Backend}/api/answers/${phone}/viewed`,
        method: "put",
    }),
    UpdateResponse: (phone, qid) => ({
        url: `${Backend}/api/answers/${phone}/responses/${qid}`,
        method: "put",
    }),
    DeleteResponse: (phone, qid) => ({
        url: `${Backend}/api/answers/${phone}/responses/${qid}`,
        method: "delete",
    }),
    DeleteAnswer: (phone) => ({
        url: `${Backend}/api/answers/${phone}`,
        method: "delete",
    }),

    // NEW: Campaign
    CampaignDownloadTemplate: {
        url: `${Backend}/api/campaign/sample`,
        method: "get",
    },
    CampaignUploadExcel: {
        url: `${Backend}/api/campaign/upload`,
        method: "post",
    },
}

export default SummaryApi
