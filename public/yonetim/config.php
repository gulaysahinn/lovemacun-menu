<?php
if (!defined('AUTH_INCLUDED')) {
    http_response_code(403);
    exit('Dogrudan erisim engellendi.');
}
// Kullanıcı kimlik bilgileri güvenli şekilde users.json (tasfirin-data/users.json) içinde tutulmaktadır.
