<?php

declare(strict_types=1);

namespace App\Enum;

enum RecurringInterval: string
{
    case WEEKLY = 'weekly';
    case MONTHLY = 'monthly';
    case QUARTERLY = 'quarterly';
    case YEARLY = 'yearly';
}
