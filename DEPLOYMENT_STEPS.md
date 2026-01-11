# 🚀 Financial Ledger - Deployment Steps

## Quick Deployment Checklist

### ✅ Prerequisites (Already Done)
- Railway MySQL database configured
- GitHub repository: `https://github.com/vishalini-12/financial-management.git`
- Project files prepared with Docker support

---

## 1. Backend Deployment (Render)

### Steps:
1. **Go to [Render.com](https://render.com)** and sign in
2. **Click "New" → "Web Service"**
3. **Connect GitHub repo:** `vishalini-12/financial-management`
4. **Configure service:**
   - **Name:** `financial-ledger-backend`
   - **Runtime:** `Docker`
   - **Dockerfile Path:** `./Dockerfile`
5. **Set Environment Variables** (copy exactly):

```
DATABASE_URL=jdbc:mysql://${{RAILWAY_PRIVATE_DOMAIN}}:3306/railway
DB_USERNAME=root
DB_PASSWORD=KgSwvxjYBXwRTeiFWzhkwPwWzGEUvdwc
PORT=10000
JWT_SECRET=RZwIqkcRGCAJQQKjwnlGpWQJw5+SlgaKG+5GHbcrHHI=
CORS_ALLOWED_ORIGINS=https://financial-management-five.vercel.app
JPA_DDL_AUTO=update
JPA_PLATFORM=org.hibernate.dialect.MySQLDialect
JPA_SHOW_SQL=false
JWT_EXPIRATION=86400000
MULTIPART_ENABLED=true
MULTIPART_MAX_FILE_SIZE=10MB
MULTIPART_MAX_REQUEST_SIZE=10MB
MULTIPART_THRESHOLD=2KB
SQL_INIT_MODE=always
```

6. **Click "Create Web Service"**
7. **Wait for deployment** (5-10 minutes)
8. **Copy the service URL** (e.g., `https://your-app.onrender.com`)

---

## 2. Frontend Deployment (Vercel)

### Steps:
1. **Go to [Vercel.com](https://vercel.com)** and sign in
2. **Click "New Project"**
3. **Import GitHub repo:** `vishalini-12/financial-management`
4. **Configure project:**
   - **Framework Preset:** `Create React App`
   - **Root Directory:** `frontend`
5. **Set Environment Variable:**
   ```
   REACT_APP_API_BASE_URL=https://financial-management-nwge.onrender.com
   ```
6. **Click "Deploy"**
7. **Wait for deployment** (2-3 minutes)
8. **Copy the deployment URL** (e.g., `https://your-app.vercel.app`)

---

## 3. Final Configuration

### Update CORS (if needed):
- In **Render dashboard** → Your service → Environment
- Ensure `CORS_ALLOWED_ORIGINS` matches your Vercel URL exactly

### Test Your Application:
1. **Visit your Vercel URL**
2. **Login with default credentials:**
   - **Admin:** `admin` / `admin123`
   - **Accountant:** `accountant` / `accountant123`
3. **Test features:** Add transactions, view reports, etc.

---

## 📋 Deployment Architecture

```
Frontend (Vercel)
    ↓ HTTPS calls
Backend (Render + Docker)
    ↓ JDBC connection
Database (Railway MySQL)
```

## 🔧 Files Used:
- `Dockerfile` - Multi-stage Docker build
- `backend/render.yaml` - Render configuration
- `frontend/vercel.json` - Vercel configuration
- `env_variables.txt` - All environment variables

## 🚨 Important Notes:
- **Railway variables** like `${{RAILWAY_PRIVATE_DOMAIN}}` are automatically replaced by Railway
- **PORT=10000** matches your Dockerfile EXPOSE directive
- **CORS** allows your Vercel frontend to call the Render backend
- **Database tables** are created automatically on first run

---

## 🎯 Success Checklist:
- [ ] Render service deployed and running
- [ ] Vercel frontend deployed
- [ ] Environment variables set correctly
- [ ] CORS configured properly
- [ ] Can login to application
- [ ] Database operations work
- [ ] All features functional

**Your app will be live at:** `https://financial-management-five.vercel.app`
