import admin, { ServiceAccount } from "firebase-admin"
import fbConfig from '../configs/firebase_config.json'

admin.initializeApp({
    credential: admin.credential.cert(fbConfig as ServiceAccount),
    projectId: fbConfig.project_id,
})

export default admin