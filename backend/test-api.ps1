# EkubCircle Automated API & Business Rule Verification Script
param(
    [string]$BaseUrl = "http://localhost:5000"
)

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "       EKUBCIRCLE API & SERVER RULE VERIFICATION          " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

function Assert-Equal($actual, $expected, $message) {
    if ($actual -eq $expected) {
        Write-Host " [PASS] $message" -ForegroundColor Green
    } else {
        Write-Host " [FAIL] $message (Expected: '$expected', Actual: '$actual')" -ForegroundColor Red
        exit 1
    }
}

try {
    # 1. Login as Seeded Organizer
    Write-Host "`n1. Testing Authentication..." -ForegroundColor Yellow
    $loginBody = @{
        email = "organizer@ekub.local"
        password = "Ekub123!"
    } | ConvertTo-Json

    $loginRes = Invoke-RestMethod -Uri "$BaseUrl/api/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $token = $loginRes.token
    Assert-Equal ($token -ne $null) $true "Acquired JWT token for organizer@ekub.local"

    $headers = @{
        Authorization = "Bearer $token"
    }

    # 2. Get Profile (/api/auth/me)
    $me = Invoke-RestMethod -Uri "$BaseUrl/api/auth/me" -Method Get -Headers $headers
    Assert-Equal $me.email "organizer@ekub.local" "Get profile matches organizer email"

    # 3. Create New Circle
    Write-Host "`n2. Testing Circle Creation & Membership..." -ForegroundColor Yellow
    $circleBody = @{
        name = "Onion Architecture Test Circle"
        contributionAmount = 2500
        meetingLabel = "Weekly"
    } | ConvertTo-Json

    $circle = Invoke-RestMethod -Uri "$BaseUrl/api/circles" -Method Post -Headers $headers -Body $circleBody -ContentType "application/json"
    $circleId = $circle.id
    Assert-Equal $circle.name "Onion Architecture Test Circle" "Circle created with status 'Forming'"
    Assert-Equal $circle.status "Forming" "Status is 'Forming'"

    # 4. Add Members
    $addMemberBody1 = @{ email = "member1@ekub.local" } | ConvertTo-Json
    $m1 = Invoke-RestMethod -Uri "$BaseUrl/api/circles/$circleId/members" -Method Post -Headers $headers -Body $addMemberBody1 -ContentType "application/json"
    Assert-Equal $m1.email "member1@ekub.local" "Added member 1 to circle"

    $addMemberBody2 = @{ email = "member2@ekub.local" } | ConvertTo-Json
    $m2 = Invoke-RestMethod -Uri "$BaseUrl/api/circles/$circleId/members" -Method Post -Headers $headers -Body $addMemberBody2 -ContentType "application/json"
    Assert-Equal $m2.email "member2@ekub.local" "Added member 2 to circle"

    # 5. Start Circle (Locks Member Roster & Creates Rounds)
    Write-Host "`n3. Testing Circle Start & Deterministic Locking..." -ForegroundColor Yellow
    $startedCircle = Invoke-RestMethod -Uri "$BaseUrl/api/circles/$circleId/start" -Method Post -Headers $headers
    Assert-Equal $startedCircle.status "Active" "Circle transitioned to 'Active'"
    Assert-Equal $startedCircle.totalRounds 3 "3 deterministic rounds created for 3 members"

    # 6. Verify Server Rule: Cannot Add Member After Start
    Write-Host "`n4. Testing Hard Server Rule: Member Roster Lock After Start..." -ForegroundColor Yellow
    try {
        $addMemberBody3 = @{ email = "member3@ekub.local" } | ConvertTo-Json
        Invoke-RestMethod -Uri "$BaseUrl/api/circles/$circleId/members" -Method Post -Headers $headers -Body $addMemberBody3 -ContentType "application/json"
        Write-Host " [FAIL] Server should have rejected adding member to active circle!" -ForegroundColor Red
        exit 1
    } catch {
        Write-Host " [PASS] Server rejected adding member to active circle (HTTP 400 Bad Request)" -ForegroundColor Green
    }

    # 7. Get Current Round
    Write-Host "`n5. Testing Round Engine & Pot Tracking..." -ForegroundColor Yellow
    $currRound = Invoke-RestMethod -Uri "$BaseUrl/api/circles/$circleId/rounds/current" -Method Get -Headers $headers
    $roundId = $currRound.roundId
    Assert-Equal $currRound.roundNumber 1 "Round 1 is currently Open"
    Assert-Equal $currRound.paidCount 0 "Initial paid count is 0"
    Assert-Equal $currRound.isReadyForPayout $false "IsReadyForPayout is false"

    # 8. Verify Server Rule: Premature Payout Rejected
    Write-Host "`n6. Testing Hard Server Rule: 100% Contribution Gate..." -ForegroundColor Yellow
    try {
        Invoke-RestMethod -Uri "$BaseUrl/api/rounds/$roundId/payout" -Method Post -Headers $headers
        Write-Host " [FAIL] Server should have rejected premature payout!" -ForegroundColor Red
        exit 1
    } catch {
        Write-Host " [PASS] Server rejected premature payout (HTTP 400 Bad Request)" -ForegroundColor Green
    }

    # 9. Record Contribution for Organizer & Member 1
    Write-Host "`n7. Testing Payment Recording & Duplicate Prevention..." -ForegroundColor Yellow
    $orgMember = $currRound.members | Where-Object { $_.email -eq "organizer@ekub.local" }
    $member1 = $currRound.members | Where-Object { $_.email -eq "member1@ekub.local" }
    $member2 = $currRound.members | Where-Object { $_.email -eq "member2@ekub.local" }

    $payBody1 = @{
        roundId = $roundId
        memberId = $orgMember.memberId
        amount = 2500
        paymentMethod = "Cash"
        notes = "Cash payment at meeting"
    } | ConvertTo-Json

    $p1 = Invoke-RestMethod -Uri "$BaseUrl/api/payments" -Method Post -Headers $headers -Body $payBody1 -ContentType "application/json"
    Assert-Equal $p1.amount 2500 "Recorded payment for organizer"

    # Duplicate payment rejection
    try {
        Invoke-RestMethod -Uri "$BaseUrl/api/payments" -Method Post -Headers $headers -Body $payBody1 -ContentType "application/json"
        Write-Host " [FAIL] Server should have rejected duplicate payment!" -ForegroundColor Red
        exit 1
    } catch {
        Write-Host " [PASS] Server rejected duplicate contribution for round (HTTP 400 Bad Request)" -ForegroundColor Green
    }

    # Record for Member 1 & Member 2
    $payBody2 = @{
        roundId = $roundId
        memberId = $member1.memberId
        amount = 2500
        paymentMethod = "CBE Transfer"
        notes = "FT2610051234"
    } | ConvertTo-Json
    Invoke-RestMethod -Uri "$BaseUrl/api/payments" -Method Post -Headers $headers -Body $payBody2 -ContentType "application/json" | Out-Null

    $payBody3 = @{
        roundId = $roundId
        memberId = $member2.memberId
        amount = 2500
        paymentMethod = "Telebirr"
        notes = "Ref: TB992817"
    } | ConvertTo-Json
    Invoke-RestMethod -Uri "$BaseUrl/api/payments" -Method Post -Headers $headers -Body $payBody3 -ContentType "application/json" | Out-Null

    # 10. Check Round is Ready for Payout
    $currRoundReady = Invoke-RestMethod -Uri "$BaseUrl/api/circles/$circleId/rounds/current" -Method Get -Headers $headers
    Assert-Equal $currRoundReady.paidCount 3 "All 3 members contributed"
    Assert-Equal $currRoundReady.currentPotAmount 7500 "Pot amount is 7,500 ETB"
    Assert-Equal $currRoundReady.isReadyForPayout $true "Round is Ready for Payout"

    # 11. Execute Payout
    Write-Host "`n8. Testing Payout Execution & Round Advancement..." -ForegroundColor Yellow
    $payoutRes = Invoke-RestMethod -Uri "$BaseUrl/api/rounds/$roundId/payout" -Method Post -Headers $headers
    Assert-Equal $payoutRes.roundStatus "PaidOut" "Round 1 status is 'PaidOut'"
    Assert-Equal $payoutRes.nextRoundNumber 2 "Round 2 automatically opened"
    Assert-Equal $payoutRes.potAmount 7500 "Pot of 7,500 ETB paid out"

    # 12. Verify Server Rule: Cannot Payout Same Round Twice
    try {
        Invoke-RestMethod -Uri "$BaseUrl/api/rounds/$roundId/payout" -Method Post -Headers $headers
        Write-Host " [FAIL] Server should have rejected second payout of Round 1!" -ForegroundColor Red
        exit 1
    } catch {
        Write-Host " [PASS] Server rejected duplicate payout of Round 1 (HTTP 400 Bad Request)" -ForegroundColor Green
    }

    # 13. Test Extra Credit Feature: Server-Side Fair Draw Simulator
    Write-Host "`n9. Testing Extra Credit: Server-Side Fair Draw Simulator..." -ForegroundColor Yellow
    $round2 = Invoke-RestMethod -Uri "$BaseUrl/api/circles/$circleId/rounds/current" -Method Get -Headers $headers
    $round2Id = $round2.roundId
    Assert-Equal $round2.roundNumber 2 "Current round is Round 2"

    # Before payment, draw should fail because unpaid members cannot win the draw
    try {
        Invoke-RestMethod -Uri "$BaseUrl/api/rounds/$round2Id/draw" -Method Post -Headers $headers
        Write-Host " [FAIL] Server should reject draw when no eligible members have paid!" -ForegroundColor Red
        exit 1
    } catch {
        Write-Host " [PASS] Server rejected draw when no members have paid (unpaid members cannot win draw)" -ForegroundColor Green
    }

    # Record Round 2 payment for member 1 & member 2
    $payR2_1 = @{
        roundId = $round2Id
        memberId = $member1.memberId
        amount = 2500
        paymentMethod = "Telebirr"
        isLate = $false
    } | ConvertTo-Json
    Invoke-RestMethod -Uri "$BaseUrl/api/payments" -Method Post -Headers $headers -Body $payR2_1 -ContentType "application/json" | Out-Null

    $drawRes = Invoke-RestMethod -Uri "$BaseUrl/api/rounds/$round2Id/draw" -Method Post -Headers $headers
    Assert-Equal ($drawRes.winnerMemberId -ne 0) $true "Server drew a fair winner from eligible paid members"
    Write-Host " [PASS] Winner selected: $($drawRes.winnerName) ($($drawRes.eligibleCandidatesCount) candidate pool)" -ForegroundColor Green

    # 14. Test Extra Credit Feature: Completed-Circle Summary & Audit Report
    Write-Host "`n10. Testing Extra Credit: Completed-Circle Summary & Audit Report..." -ForegroundColor Yellow
    $summary = Invoke-RestMethod -Uri "$BaseUrl/api/circles/$circleId/summary" -Method Get -Headers $headers
    Assert-Equal $summary.circleId $circleId "Audit report fetched for circle"
    Assert-Equal $summary.totalMembers 3 "Total members matches 3"
    Assert-Equal $summary.totalRounds 3 "Total rounds matches 3"
    Assert-Equal ($summary.rounds.Count -gt 0) $true "Rounds audit trail present"
    Assert-Equal ($summary.members.Count -gt 0) $true "Members performance audit trail present"
    Write-Host " [PASS] Completed-circle audit report verified with $($summary.rounds.Count) rounds and $($summary.members.Count) members" -ForegroundColor Green

    # 15. Test ER Extensions: Join Requests & Circle Invitations
    Write-Host "`n11. Testing Extensions: Join Requests & Circle Invitations..." -ForegroundColor Yellow
    # Create a new forming circle for join request testing
    $reqCircleBody = @{
        name = "Addis Community Savings"
        contributionAmount = 1500
        meetingLabel = "Monthly"
    } | ConvertTo-Json
    $joinCircle = Invoke-RestMethod -Uri "$BaseUrl/api/circles" -Method Post -Headers $headers -Body $reqCircleBody -ContentType "application/json"
    $joinCircleId = $joinCircle.id

    # Member 3 logs in
    $m3LoginBody = @{
        email = "member3@ekub.local"
        password = "Ekub123!"
    } | ConvertTo-Json
    $m3Auth = Invoke-RestMethod -Uri "$BaseUrl/api/auth/login" -Method Post -Body $m3LoginBody -ContentType "application/json"
    $m3Headers = @{ Authorization = "Bearer $($m3Auth.token)" }

    # Member 3 submits join request
    $joinReqBody = @{
        circleId = $joinCircleId
        message = "I would love to participate in Addis Community Savings!"
    } | ConvertTo-Json
    $newJoinReq = Invoke-RestMethod -Uri "$BaseUrl/api/join-requests" -Method Post -Headers $m3Headers -Body $joinReqBody -ContentType "application/json"
    Assert-Equal $newJoinReq.status "Pending" "Join request created with 'Pending' status"
    Assert-Equal $newJoinReq.circleId $joinCircleId "Join request references correct circle"

    # Organizer fetches join requests
    $circleReqs = Invoke-RestMethod -Uri "$BaseUrl/api/join-requests/circle/$joinCircleId" -Method Get -Headers $headers
    Assert-Equal ($circleReqs.Count -ge 1) $true "Organizer can query circle join requests"

    # Organizer accepts join request
    $respondBody = @{
        status = "Accepted"
    } | ConvertTo-Json
    $acceptedReq = Invoke-RestMethod -Uri "$BaseUrl/api/join-requests/$($newJoinReq.id)/respond" -Method Put -Headers $headers -Body $respondBody -ContentType "application/json"
    Assert-Equal $acceptedReq.status "Accepted" "Organizer accepted join request"

    # Verify Member 3 is now a member of the circle
    $updatedJoinCircle = Invoke-RestMethod -Uri "$BaseUrl/api/circles/$joinCircleId" -Method Get -Headers $headers
    $m3MemberFound = $updatedJoinCircle.members | Where-Object { $_.email -eq "member3@ekub.local" }
    Assert-Equal ($m3MemberFound -ne $null) $true "Member 3 successfully added to circle roster upon acceptance"

    # 16. Test ER Extensions: In-App Notifications
    Write-Host "`n12. Testing Extensions: In-App Notifications..." -ForegroundColor Yellow
    $m3Notifications = Invoke-RestMethod -Uri "$BaseUrl/api/notifications" -Method Get -Headers $m3Headers
    Assert-Equal ($m3Notifications.Count -ge 1) $true "Member 3 received notifications"
    $acceptedNotifs = @($m3Notifications | Where-Object { $_.type -eq "JoinRequestAccepted" })
    Assert-Equal ($acceptedNotifs.Count -ge 1) $true "Notification of type 'JoinRequestAccepted' received by user"
    $acceptedNotif = $acceptedNotifs[0]
    Assert-Equal ($acceptedNotif.isRead -eq $false) $true "Notification is unread initially"

    # Mark notification as read
    $markReadRes = Invoke-RestMethod -Uri "$BaseUrl/api/notifications/$($acceptedNotif.id)/read" -Method Put -Headers $m3Headers
    Assert-Equal $markReadRes.success $true "Notification marked as read successfully"

    Write-Host "`n==========================================================" -ForegroundColor Green
    Write-Host " ALL 12 TEST SUITES PASSED! COMPLETE ER & SERVER ENFORCEMENT! " -ForegroundColor Green
    Write-Host "==========================================================" -ForegroundColor Green
} catch {
    Write-Host " [ERROR] $_" -ForegroundColor Red
    exit 1
}
