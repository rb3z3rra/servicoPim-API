import { AuthService } from "../services/AuthService.js";
import { appDataSource } from "../database/appDataSource.js";
const authService = new AuthService(appDataSource);
export class AuthController {
    async login(req, res) {
        const result = await authService.login(req.body);
        return res.status(200).json(result);
    }
}
//# sourceMappingURL=AuthController.js.map