# Testing Guide - Tracker Suite

This guide will help you verify that the project is working correctly.

## Prerequisites Check

### 1. Check Node.js Version
```bash
node --version
# Should be v18.x or v20.x
```

### 2. Check npm
```bash
npm --version
# Should be v9.x or higher
```

### 3. Check if dependencies are installed
```bash
ls node_modules
# Should show many packages
```

## Method 1: Quick Test (Recommended)

### Step 1: Run the Test Suite
```bash
npm test run
```
**Expected Output:** All tests should pass ✓

### Step 2: Check TypeScript Compilation
```bash
npm run check
```
**Expected Output:** No critical TypeScript errors

### Step 3: Try Building the Project
```bash
npm run build
```
**Expected Output:** Build completes successfully, creates `dist/` folder

## Method 2: Start Development Server

### Step 1: Set up Environment
```bash
# Copy environment template
cp .env.example .env

# Edit .env and add your database URL
# For testing, you can use a local PostgreSQL or Neon database
```

### Step 2: Set up Database
```bash
npm run db:push
```
**Expected Output:** Database schema created successfully

### Step 3: Start Development Server
```bash
npm run dev
```
**Expected Output:**
- Server starts on port 5000
- No errors in console
- Message: "Server running on http://0.0.0.0:5000"

### Step 4: Test in Browser
Open your browser and navigate to:
```
http://localhost:5000
```

**Expected Result:**
- Landing page loads
- You can see the Tracker Suite interface
- No console errors in browser DevTools

### Step 5: Test Registration
1. Click "Get Started" or "Sign Up"
2. Fill in registration form
3. Submit

**Expected Result:**
- User is created
- Redirected to dashboard
- No errors

## Method 3: Docker Testing (Easiest - No Database Setup Needed)

### Step 1: Start with Docker Compose
```bash
docker-compose up
```

**Expected Output:**
- PostgreSQL container starts
- App container builds and starts
- Server running on port 5000

### Step 2: Test in Browser
```
http://localhost:5000
```

### Step 3: Stop Docker
```bash
# Press Ctrl+C, then:
docker-compose down
```

## Method 4: API Testing

### Test Health Endpoints
```bash
# Start the server first (npm run dev or docker-compose up)

# Test health check
curl http://localhost:5000/health

# Expected: {"status":"ok"}

# Test ready endpoint
curl http://localhost:5000/ready

# Expected: {"status":"ready","database":"connected"}
```

### Test API Endpoints
```bash
# Test API root
curl http://localhost:5000/api/v1/

# Expected: API information
```

## Method 5: Code Quality Checks

### Run Linter
```bash
npm run lint
```
**Expected:** Shows linting results (warnings are OK)

### Run Formatter Check
```bash
npm run format
```
**Expected:** Formats code successfully

## Troubleshooting

### Issue: "Cannot find module"
**Solution:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### Issue: "Database connection failed"
**Solution:**
- Check your DATABASE_URL in .env
- Make sure PostgreSQL is running
- Or use Docker: `docker-compose up`

### Issue: "Port 5000 already in use"
**Solution:**
```bash
# Find and kill the process
lsof -ti:5000 | xargs kill -9

# Or change port in server/index.ts
```

### Issue: "Build fails"
**Solution:**
```bash
# Clear cache and rebuild
rm -rf dist
npm run build
```

## Quick Verification Checklist

- [ ] Dependencies installed (`npm install`)
- [ ] Tests pass (`npm test run`)
- [ ] TypeScript compiles (`npm run check`)
- [ ] Build succeeds (`npm run build`)
- [ ] Dev server starts (`npm run dev`)
- [ ] App loads in browser (http://localhost:5000)
- [ ] Can register a new user
- [ ] Can login
- [ ] Dashboard loads

## Testing with Sample Data

### Create Test User via API
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!",
    "confirmPassword": "Test123!",
    "firstName": "Test",
    "lastName": "User",
    "role": "individual"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!"
  }'
```

## Performance Testing

### Check Build Size
```bash
npm run build
du -sh dist/
```

### Check Memory Usage
```bash
# While server is running
ps aux | grep node
```

## Success Criteria

✅ **Project is working if:**
1. Tests pass
2. Server starts without errors
3. App loads in browser
4. Can create and login users
5. Database operations work
6. No critical console errors

❌ **Project has issues if:**
1. Tests fail
2. Server crashes on startup
3. Database connection fails
4. Build fails
5. Critical errors in console

## Next Steps After Verification

1. **Add your database**: Update DATABASE_URL in .env
2. **Configure email**: Add RESEND_API_KEY for email features
3. **Customize**: Modify branding and features
4. **Deploy**: Use Docker or deploy to cloud platform

---

**Need Help?**
- Check the main README.md
- Review IMPLEMENTATION_SUMMARY.md
- Check server logs for errors
- Verify environment variables
