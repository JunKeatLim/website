<?php
/**
 * dashboard/subscriptions/review-and-pay.php
 * User selects a plan for a pet (or confirms a pre-selected plan) and purchases.
 */
require_once __DIR__ . '/../../config/constants.php';
require_once __DIR__ . '/../../config/session.php';
require_once __DIR__ . '/../../config/database.php';
require_once __DIR__ . '/../../includes/sanitize.php';
require_once __DIR__ . '/../../includes/csrf.php';
require_once __DIR__ . '/../../auth/middleware.php';

requireLogin();

/** @var PDO $db */

$userId = (int) ($_SESSION['user_id'] ?? 0);
$errors  = [];
$success = '';

// ── Get pet_id and optional plan_id from query string ────────
$petId  = inputInt('pet_id', 'GET');
$planId = inputInt('plan_id', 'GET');

// Validate pet belongs to user
$pet = null;
if ($petId) {
    $stmt = $db->prepare('SELECT * FROM pets WHERE id = :id AND user_id = :uid LIMIT 1');
    $stmt->execute([':id' => $petId, ':uid' => $userId]);
    $pet = $stmt->fetch();
}

// If no valid pet, redirect to my-pets
if (!$pet) {
    header('Location: /dashboard/my-pets.php');
    exit;
}

// Check if pet already has an active subscription
$existingSub = null;
$stmt = $db->prepare('
    SELECT s.*, ip.name AS plan_name
    FROM subscriptions s
    JOIN insurance_plans ip ON ip.id = s.plan_id
    WHERE s.pet_id = :pid AND s.user_id = :uid AND s.status = :status
    LIMIT 1
');
$stmt->execute([':pid' => $petId, ':uid' => $userId, ':status' => 'active']);
$existingSub = $stmt->fetch();

if ($existingSub) {
    // Pet already covered — redirect back
    $_SESSION['flash_message'] = esc($pet['name']) . ' already has an active plan.';
    header('Location: /dashboard/my-pets.php');
    exit;
}

// Fetch available plans
$plans = $db->query("SELECT * FROM insurance_plans WHERE is_active = 1 ORDER BY monthly_premium ASC")->fetchAll();
if (empty($plans)) {
    $plans = [
        ['id' => 1, 'name' => 'Basic',    'monthly_premium' => '29.99', 'annual_limit' => '5000.00',  'deductible' => '100.00', 'coverage_pct' => '70.00', 'description' => 'Essential coverage for routine vet visits and minor treatments.'],
        ['id' => 2, 'name' => 'Premium',  'monthly_premium' => '49.99', 'annual_limit' => '15000.00', 'deductible' => '50.00',  'coverage_pct' => '80.00', 'description' => 'Comprehensive coverage including surgeries, diagnostics, and specialist referrals.'],
        ['id' => 3, 'name' => 'Ultimate', 'monthly_premium' => '79.99', 'annual_limit' => '50000.00', 'deductible' => '0.00',   'coverage_pct' => '90.00', 'description' => 'Full coverage with zero deductible, from routine checkups to emergency surgeries.'],
    ];
}

// Pre-select plan if passed via query string
$selectedPlan = null;
if ($planId) {
    foreach ($plans as $p) {
        if ((int)$p['id'] === $planId) {
            $selectedPlan = $p;
            break;
        }
    }
}

// ── Handle purchase POST ─────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    requireValidCsrf();

    $chosenPlanId = inputInt('plan_id');
    $duration     = inputInt('duration'); // months: 1, 6, or 12

    if (!$chosenPlanId) $errors['plan'] = 'Please select a plan.';
    if (!in_array($duration, [1, 6, 12], true)) $errors['duration'] = 'Please select a valid duration.';

    // Validate plan exists
    $chosenPlan = null;
    if ($chosenPlanId) {
        foreach ($plans as $p) {
            if ((int)$p['id'] === $chosenPlanId) {
                $chosenPlan = $p;
                break;
            }
        }
        if (!$chosenPlan) $errors['plan'] = 'Invalid plan selected.';
    }

    // Double-check no active sub
    $stmt = $db->prepare('SELECT id FROM subscriptions WHERE pet_id = :pid AND user_id = :uid AND status = :status LIMIT 1');
    $stmt->execute([':pid' => $petId, ':uid' => $userId, ':status' => 'active']);
    if ($stmt->fetch()) {
        $errors['plan'] = 'This pet already has an active subscription.';
    }

    if (!$errors) {
        $startDate = date('Y-m-d');
        $endDate   = date('Y-m-d', strtotime("+{$duration} months"));

        $stmt = $db->prepare('
            INSERT INTO subscriptions (user_id, pet_id, plan_id, status, start_date, end_date)
            VALUES (:uid, :pid, :plan_id, :status, :start, :end)
        ');
        $stmt->execute([
            ':uid'     => $userId,
            ':pid'     => $petId,
            ':plan_id' => (int)$chosenPlan['id'],
            ':status'  => 'active',
            ':start'   => $startDate,
            ':end'     => $endDate,
        ]);

        $_SESSION['flash_message'] = 'Policy purchased! ' . esc($pet['name']) . ' is now covered under the ' . esc($chosenPlan['name']) . ' plan.';
        header('Location: /dashboard/my-pets.php');
        exit;
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Purchase Policy — PawShield</title>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css">
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
    <link rel="stylesheet" href="/assets/css/style.css">
    <link rel="stylesheet" href="/assets/css/accessibility.css">
</head>
<body>

<?php require_once __DIR__ . '/../../includes/navbar.php'; ?>

<main id="main-content">
<div class="container py-5" style="max-width: 900px;">

    <a href="/dashboard/my-pets.php" class="btn btn-outline-secondary btn-sm mb-4">
        <i class="bi bi-arrow-left me-1"></i> Back to My Pets
    </a>

    <h2 class="mb-2"><i class="bi bi-shield-check me-2"></i>Purchase Policy</h2>
    <p class="text-muted mb-4">
        Choose a plan for <strong><?= esc($pet['name']) ?></strong>
        (<?= esc(ucfirst($pet['species'])) ?><?= $pet['breed'] ? ', ' . esc($pet['breed']) : '' ?>)
    </p>

    <?php if (!empty($errors)): ?>
        <div class="alert alert-danger">
            <?php foreach ($errors as $e): ?>
                <div><?= esc($e) ?></div>
            <?php endforeach; ?>
        </div>
    <?php endif; ?>

    <form method="POST" id="purchaseForm">
        <?php csrfField(); ?>

        <!-- Plan selection -->
        <div class="row g-3 mb-4">
            <?php
            $planIcons = ['bi-shield', 'bi-shield-fill-check', 'bi-shield-fill-plus'];
            foreach ($plans as $i => $plan):
                $isSelected = ($selectedPlan && (int)$selectedPlan['id'] === (int)$plan['id']);
            ?>
            <div class="col-md-4">
                <div class="card h-100 plan-select-card <?= $isSelected ? 'border-primary shadow' : '' ?>"
                     style="cursor: pointer;"
                     onclick="selectPlan(<?= (int)$plan['id'] ?>, this)">
                    <div class="card-body text-center">
                        <i class="bi <?= $planIcons[$i] ?? 'bi-shield' ?> fs-2 text-primary mb-2 d-block"></i>
                        <h5 class="card-title"><?= esc($plan['name']) ?></h5>
                        <div class="mb-2">
                            <span class="fs-3 fw-bold">$<?= number_format((float)$plan['monthly_premium'], 2) ?></span>
                            <span class="text-muted">/mo</span>
                        </div>
                        <ul class="list-unstyled small text-start">
                            <li><i class="bi bi-check-circle-fill text-success me-1"></i>
                                Up to $<?= number_format((float)$plan['annual_limit']) ?> annual limit</li>
                            <li><i class="bi bi-check-circle-fill text-success me-1"></i>
                                <?= number_format((float)$plan['coverage_pct']) ?>% coverage</li>
                            <li><i class="bi bi-check-circle-fill text-success me-1"></i>
                                $<?= number_format((float)$plan['deductible']) ?> deductible</li>
                        </ul>
                        <p class="text-muted small mt-2 mb-0"><?= esc($plan['description']) ?></p>
                    </div>
                </div>
            </div>
            <?php endforeach; ?>
        </div>

        <input type="hidden" name="plan_id" id="selectedPlanId"
               value="<?= $selectedPlan ? (int)$selectedPlan['id'] : '' ?>">

        <!-- Duration selection -->
        <div class="card mb-4">
            <div class="card-body">
                <h5 class="card-title mb-3"><i class="bi bi-calendar-event me-2"></i>Select Duration</h5>
                <div class="row g-3">
                    <div class="col-md-4">
                        <div class="form-check border rounded p-3">
                            <input class="form-check-input" type="radio" name="duration"
                                   id="dur1" value="1">
                            <label class="form-check-label w-100" for="dur1">
                                <strong>1 Month</strong>
                                <span class="text-muted d-block small">Try it out</span>
                            </label>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="form-check border rounded p-3">
                            <input class="form-check-input" type="radio" name="duration"
                                   id="dur6" value="6">
                            <label class="form-check-label w-100" for="dur6">
                                <strong>6 Months</strong>
                                <span class="text-muted d-block small">Most flexible</span>
                            </label>
                        </div>
                    </div>
                    <div class="col-md-4">
                        <div class="form-check border rounded p-3">
                            <input class="form-check-input" type="radio" name="duration"
                                   id="dur12" value="12" checked>
                            <label class="form-check-label w-100" for="dur12">
                                <strong>12 Months</strong>
                                <span class="text-muted d-block small">Best value</span>
                            </label>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Summary & confirm -->
        <div class="card border-primary mb-4" id="summaryCard" style="display:none;">
            <div class="card-body">
                <h5 class="card-title"><i class="bi bi-receipt me-2"></i>Order Summary</h5>
                <table class="table table-borderless mb-3">
                    <tr>
                        <td class="text-muted">Pet</td>
                        <td class="fw-semibold"><?= esc($pet['name']) ?></td>
                    </tr>
                    <tr>
                        <td class="text-muted">Plan</td>
                        <td class="fw-semibold" id="summaryPlan">—</td>
                    </tr>
                    <tr>
                        <td class="text-muted">Duration</td>
                        <td class="fw-semibold" id="summaryDuration">12 months</td>
                    </tr>
                    <tr>
                        <td class="text-muted">Monthly cost</td>
                        <td class="fw-semibold" id="summaryMonthly">—</td>
                    </tr>
                    <tr class="border-top">
                        <td class="text-muted fw-bold">Total</td>
                        <td class="fw-bold fs-5 text-primary" id="summaryTotal">—</td>
                    </tr>
                </table>
            </div>
        </div>

        <button type="submit" class="btn btn-primary btn-lg w-100" id="purchaseBtn" disabled>
            <i class="bi bi-lock me-2"></i>Confirm & Purchase
        </button>
    </form>

</div>
</main>

<?php require_once __DIR__ . '/../../includes/footer.php'; ?>

<script>
    const plans = <?= json_encode(array_map(function($p) {
        return [
            'id' => (int)$p['id'],
            'name' => $p['name'],
            'monthly_premium' => (float)$p['monthly_premium'],
        ];
    }, $plans)) ?>;

    let selectedPlanId = document.getElementById('selectedPlanId').value
        ? parseInt(document.getElementById('selectedPlanId').value) : null;

    function selectPlan(planId, cardEl) {
        selectedPlanId = planId;
        document.getElementById('selectedPlanId').value = planId;

        // Highlight selected card
        document.querySelectorAll('.plan-select-card').forEach(c => {
            c.classList.remove('border-primary', 'shadow');
        });
        cardEl.classList.add('border-primary', 'shadow');

        updateSummary();
    }

    function getSelectedDuration() {
        const checked = document.querySelector('input[name="duration"]:checked');
        return checked ? parseInt(checked.value) : 12;
    }

    function updateSummary() {
        const plan = plans.find(p => p.id === selectedPlanId);
        const duration = getSelectedDuration();
        const card = document.getElementById('summaryCard');
        const btn = document.getElementById('purchaseBtn');

        if (!plan) {
            card.style.display = 'none';
            btn.disabled = true;
            return;
        }

        card.style.display = 'block';
        btn.disabled = false;

        document.getElementById('summaryPlan').textContent = plan.name;
        document.getElementById('summaryDuration').textContent = duration + (duration === 1 ? ' month' : ' months');
        document.getElementById('summaryMonthly').textContent = '$' + plan.monthly_premium.toFixed(2);

        const total = plan.monthly_premium * duration;
        document.getElementById('summaryTotal').textContent = '$' + total.toFixed(2);
    }

    // Listen for duration changes
    document.querySelectorAll('input[name="duration"]').forEach(radio => {
        radio.addEventListener('change', updateSummary);
    });

    // Initialize if plan pre-selected
    if (selectedPlanId) {
        updateSummary();
    }
</script>