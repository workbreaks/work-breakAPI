import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, VerifyCallback } from "passport-github";
import { AuthService } from "./auth.service";
import * as https from "https";

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, "github") {
  constructor(private readonly authService: AuthService) {
    super({
      clientID: process.env.GITHUB_ID,
      clientSecret: process.env.GITHUB_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URL,
      scope: ["user:email"],
      passReqToCallback: true,
      session: false,
    });
  }

  async fetchGithubEmails(accessToken: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: "api.github.com",
        path: "/user/emails",
        method: "GET",
        headers: {
          Authorization: `token ${accessToken}`,
          "User-Agent": "Node.js",
          Accept: "application/vnd.github.v3+json",
        },
      };

      const req = https.request(options, (res) => {
        let data = "";

        res.on("data", (chunk) => {
          data += chunk;
        });

        res.on("end", () => {
          try {
            const emails = JSON.parse(data);
            resolve(emails);
          } catch (error) {
            reject(`Error parsing GitHub email response: ${error.message}`);
          }
        });
      });

      req.on("error", (error) => {
        reject(`GitHub API request error: ${error.message}`);
      });

      req.end();
    });
  }

  async validate(
    req,
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    const { id, username, emails } = profile;
    let email = emails?.length ? emails[0].value : null;

    if (!email) {
      try {
        const emailData = await this.fetchGithubEmails(accessToken);

        const primaryEmail = emailData.find(
          (e) => e.primary && e.verified,
        )?.email;
        email =
          primaryEmail || (emailData.length > 0 ? emailData[0].email : null);
      } catch (error) {
        console.error("Error fetching emails from GitHub:", error);
      }
    }

    const userDetails = {
      githubId: id,
      name: username,
      email: email,
    };

    const stated = req.query?.state || "web";
    const user = await this.authService.findOrCreate(userDetails);
    const plainUser = user.toObject();
    plainUser.state = stated;

    return done(null, plainUser);
  }
}
