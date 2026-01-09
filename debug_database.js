// Debug script to check database connection and API endpoints
// Run this in browser console to debug the issue

async function debugDatabaseIssue() {
    console.log('=== DATABASE DEBUG START ===');

    // Check if user is authenticated
    const token = localStorage.getItem('token');
    console.log('Auth token exists:', !!token);
    console.log('Token length:', token?.length || 0);

    if (!token) {
        console.error('❌ No authentication token found!');
        return;
    }

    // Test 1: Check dashboard summary API
    console.log('=== TESTING DASHBOARD SUMMARY API ===');
    try {
        const summaryResponse = await fetch('http://localhost:8080/api/transactions/dashboard/summary', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log('Summary API status:', summaryResponse.status);

        if (summaryResponse.ok) {
            const summaryData = await summaryResponse.json();
            console.log('✅ Summary API response:', summaryData);

            if (summaryData.totalCredit === 0 && summaryData.totalDebit === 0) {
                console.log('❌ Summary API returned 0 values - this indicates no data in database');
            } else {
                console.log('✅ Summary API returned real data');
            }
        } else {
            const errorText = await summaryResponse.text();
            console.error('❌ Summary API failed:', errorText);
        }
    } catch (error) {
        console.error('❌ Summary API error:', error);
    }

    // Test 2: Check transactions list API
    console.log('=== TESTING TRANSACTIONS LIST API ===');
    try {
        const transactionsResponse = await fetch('http://localhost:8080/api/transactions', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        console.log('Transactions API status:', transactionsResponse.status);

        if (transactionsResponse.ok) {
            const transactionsData = await transactionsResponse.json();
            console.log('✅ Transactions API response count:', transactionsData.length);

            if (transactionsData.length === 0) {
                console.log('❌ Transactions API returned empty array');
            } else {
                console.log('✅ Transactions API returned data:', transactionsData.slice(0, 2));
            }
        } else {
            const errorText = await transactionsResponse.text();
            console.error('❌ Transactions API failed:', errorText);
        }
    } catch (error) {
        console.error('❌ Transactions API error:', error);
    }

    // Test 3: Direct database check via backend endpoint
    console.log('=== TESTING DATABASE HEALTH CHECK ===');
    try {
        const healthResponse = await fetch('http://localhost:8080/api/transactions/database/status', {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (healthResponse.ok) {
            const healthData = await healthResponse.json();
            console.log('✅ Database health:', healthData);
        } else {
            console.error('❌ Database health check failed');
        }
    } catch (error) {
        console.error('❌ Database health check error:', error);
    }

    console.log('=== DATABASE DEBUG COMPLETE ===');
    console.log('If APIs return 0 values but you see data in MySQL, the app is using H2 in-memory database!');
}

// Run the debug function
debugDatabaseIssue();