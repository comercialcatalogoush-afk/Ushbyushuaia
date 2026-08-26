-- ============================================================
-- ACTUALIZACIÓN DE VIDEOS DE PRODUCTOS (Google Drive)
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query → pegar todo → Run
--
-- Notas:
--   * Los videos viven en Google Drive; en la BD solo se guarda la URL
--     (no consumen espacio en Supabase ni en Vercel).
--   * 552682 y 552821 apuntaban al mismo archivo → quedan SIN VIDEO.
--   * 552697 tenía un enlace de CARPETA de Drive, no un archivo de video;
--     una carpeta no se puede reproducir embebida → también queda sin video.
-- ============================================================

update public.products as p
set video_url = v.url
from (
  values
    ('558077', 'https://drive.google.com/file/d/1ZCQ9yycEkNuoK_5jJ8fHL5dAoRzVV-4W/view?usp=drive_link'),
    ('558079', 'https://drive.google.com/file/d/1NxKkoroWobrBJWiY-fcoGvAH7033FwWs/view?usp=drive_link'),
    ('558075', 'https://drive.google.com/file/d/1h1Pfu049GJGOehJyPYQvAIrh0qAMReqg/view?usp=drive_link'),
    ('558070', 'https://drive.google.com/file/d/16c37pEbG2M4AqtMneboxCHpHpCuoxBST/view?usp=drive_link'),
    ('558072', 'https://drive.google.com/file/d/1DWvx4G6FrlSThSLRbqEtPmfZvc0R46HX/view?usp=drive_link'),
    ('558071', 'https://drive.google.com/file/d/1GNZjgxDKLs2vf3O5AFGnbG_gEh_ZWnsy/view?usp=drive_link'),
    ('552699', 'https://drive.google.com/file/d/1IjF1r4npPvqUVvF353m1-i92Jc8Uewlv/view?usp=drive_link'),
    ('552810', 'https://drive.google.com/file/d/1PLMb3rGLf1gBHFyhWRRexv2YfwlPhuE2/view?usp=drive_link'),
    ('552808', 'https://drive.google.com/file/d/1ILXBUPzTuH8zZ22v-bLwtJRx9NXaVXFD/view?usp=drive_link'),
    ('552739', 'https://drive.google.com/file/d/19MsGgWSvcGdDUfuYfl8cF5oJbRCAO4TN/view?usp=drive_link'),
    ('552516', 'https://drive.google.com/file/d/16ijTMIO9yQGQYY7d-4rhxZRhNsn1p_ZM/view?usp=drive_link'),
    ('552691', 'https://drive.google.com/file/d/11jBjsjDGQS3Da5_L2MOvyswVEoIejdnE/view?usp=drive_link'),
    ('552850', 'https://drive.google.com/file/d/1suEqjbQ_qVkTfB85yzKc6a9Vje2qw4wB/view?usp=drive_link'),
    ('552809', 'https://drive.google.com/file/d/1W7U9OOrp27GM_sAbmNqi-uy9SC0iQ5tY/view?usp=drive_link'),
    ('552738', 'https://drive.google.com/file/d/1UG2UxFNBDb4pAZyv_kZs08d0wMwA2KTL/view?usp=drive_link'),
    ('552830', 'https://drive.google.com/file/d/1zX4Vou9eYE0nuia6LSd1pdg-mijt6Ifv/view?usp=drive_link'),
    ('552829', 'https://drive.google.com/file/d/1fC2OEWhYfT5cE_v6xQvp5Mj51iT5aZ4I/view?usp=drive_link'),
    ('552836', 'https://drive.google.com/file/d/1u4I7RK6DBvO96hKiFSzifOsvkPE3-P78/view?usp=drive_link'),
    ('552776', 'https://drive.google.com/file/d/1ryEcML7_9-HxSbRIUzLXDO0qDU6lRX1C/view?usp=drive_link'),
    ('552773', 'https://drive.google.com/file/d/1GzeaFfcwJVeT3wJI7PrkJZxf2AsxLwSC/view?usp=drive_link'),
    ('552749', 'https://drive.google.com/file/d/165XNwcN-p1UHaGuGI9nXsFeGykeyMWx-/view?usp=drive_link'),
    ('552782', 'https://drive.google.com/file/d/1UwUUhgbqdvGSPeIMWr4fu_VgCiUp_8m_/view?usp=drive_link'),
    ('552780', 'https://drive.google.com/file/d/1VMbLlRAjYAvnRlLyGEeEsEyFchZR82GJ/view?usp=drive_link'),
    ('552750', 'https://drive.google.com/file/d/1a22fltXQQjF_HphYCvmO84dazHKZCwPB/view?usp=drive_link'),
    ('552770', 'https://drive.google.com/file/d/1oxYAfhN3OOiowK63byvKhKpo-HToevGY/view?usp=drive_link'),
    ('552746', 'https://drive.google.com/file/d/1A2C9ZEK6BpPsq2Gpk0RUozy2UOkK5VeP/view?usp=drive_link'),
    ('552761', 'https://drive.google.com/file/d/1AHU2fK4VaXaC2uhoS043mZaA7dJYVmyW/view?usp=drive_link'),
    ('552744', 'https://drive.google.com/file/d/1zOuTFEKzNXE1yqq1Te_dsTnUlILY7KV1/view?usp=drive_link'),
    ('552871', 'https://drive.google.com/file/d/1u4_0QNr9D8tuOFfxt-8n1dWBl68Zodg_/view?usp=drive_link'),
    ('552874', 'https://drive.google.com/file/d/1b26BMQpnv6nTgw4eWmGOB70gaFJ391dn/view?usp=drive_link'),
    ('552872', 'https://drive.google.com/file/d/1Iju9GyKxJruw-Q0o9KEHlqhq53wRvso6/view?usp=drive_link'),
    ('552870', 'https://drive.google.com/file/d/1jAykoQffZUDG_8ikgHWqzh94761JwECs/view?usp=drive_link'),
    ('552869', 'https://drive.google.com/file/d/1oQwFHVw7H-CK4ECD9CYnfvg0AgQV3KOJ/view?usp=drive_link'),
    ('552875', 'https://drive.google.com/file/d/1Owm42WhjzVOFOPdsNVRiAn8fnSq3i555/view?usp=drive_link'),
    ('552873', 'https://drive.google.com/file/d/14dHNDBQYXtdwsEwOWfOC74oKsorBmwwB/view?usp=drive_link'),
    ('552868', 'https://drive.google.com/file/d/14X1YUEUgAUURFu0jkeyv2Lwpb3Q6nM7t/view?usp=drive_link'),
    ('552865', 'https://drive.google.com/file/d/11dUWgXbze58aBfNQf8MosNYSbp5wyNgC/view?usp=drive_link'),
    ('552862', 'https://drive.google.com/file/d/14JVAI9f7xLyRDg3UJesmM0F2joS6gM_f/view?usp=drive_link'),
    ('552854', 'https://drive.google.com/file/d/1BH6uS3NeG0nGNHEkIZcdGx9wzlJwMUle/view?usp=drive_link'),
    ('552864', 'https://drive.google.com/file/d/10UsM2Z6fH2oLIyD6qDasMHvPjBcuT_Ts/view?usp=drive_link'),
    ('552859', 'https://drive.google.com/file/d/1lDfM7UD-x8IR6SeCr-2sVHEE6Tjgj8B6/view?usp=drive_link'),
    ('552863', 'https://drive.google.com/file/d/1gJ6Bt-HJUUD4GO1toTKeQw7JpSMRLPyM/view?usp=drive_link'),
    ('552828', 'https://drive.google.com/file/d/1hG27kz-rgc8hKZ781UtNOhffCBbyOldQ/view?usp=drive_link'),
    ('552853', 'https://drive.google.com/file/d/15ZJnsdVzuFkUXe0o47XN1pZX398jcsR3/view?usp=drive_link'),
    ('552879', 'https://drive.google.com/file/d/1eX5aJSPrBKclZxR5X0ntgNoKu3CS_dIM/view?usp=drive_link'),
    ('552851', 'https://drive.google.com/file/d/19sRFTBfQ5912gp_DTKmAcxZZXV65Ueom/view?usp=drive_link'),
    ('552576', 'https://drive.google.com/file/d/1LFdTdlQwIMvEIr8THmQI5M6kVgUZNpMM/view?usp=drive_link'),
    ('552627', 'https://drive.google.com/file/d/1Gf1hdQ-M5F07FA0DJ7MMAuniwTNxpNvl/view?usp=drive_link'),
    ('552637', 'https://drive.google.com/file/d/1XFZ7is_n9mPJo-Eium7cnsImmht1FjWr/view?usp=drive_link'),
    ('552715', 'https://drive.google.com/file/d/1_-zzMh0bDXVBG9mqnUw4pnjiPj-s3XYp/view?usp=drive_link'),
    ('552717', 'https://drive.google.com/file/d/1j4Jf9Y6pKjdvTZczLJJSYwcAlfr8Bfak/view?usp=drive_link'),
    ('552642', 'https://drive.google.com/file/d/1GmugytYCk9ITRawzb1nixXbShDNpcEKs/view?usp=drive_link'),
    ('552716', 'https://drive.google.com/file/d/1zGb0rkCoFs0rL6LLN3F0tc5QDZjKeTk3/view?usp=drive_link'),
    ('552725', 'https://drive.google.com/file/d/1U8TlMSzsE1KR6md0-AxmcIyfKel2dqnx/view?usp=drive_link'),
    ('552631', 'https://drive.google.com/file/d/1aSl7OrqOdEjBlc2fpHS738AiluYLtbZY/view?usp=drive_link'),
    ('552640', 'https://drive.google.com/file/d/1EPFzJi0gI3R9wbRK7rDFchnHc2eXK_uE/view?usp=drive_link'),
    ('552724', 'https://drive.google.com/file/d/1UTN8FfTbkWYQZNEl4hpcqHmotnBcQA7S/view?usp=drive_link'),
    ('552638', 'https://drive.google.com/file/d/19G-G8leGWoWxK65CUsqKOF35ioptZ1or/view?usp=drive_link'),
    ('552813', 'https://drive.google.com/file/d/1ldVhz-4Wp2RAVD39RPbZKJCnz6Is9RzD/view?usp=drive_link'),
    ('552814', 'https://drive.google.com/file/d/1zMY2T8cgvPm-CSd68pEqTA6micrsJids/view?usp=drive_link'),
    ('552778', 'https://drive.google.com/file/d/151U_FE06wdqyGUF9_iD-OgAj5gMcm2Nz/view?usp=drive_link'),
    ('552816', 'https://drive.google.com/file/d/18vDzDT7UdIsh-FpLUHl8rKN23RAWoh5L/view?usp=drive_link'),
    ('552839', 'https://drive.google.com/file/d/13ejUx3v6NyhukpzMIFfl6GNLesLzd-f0/view?usp=drive_link'),
    ('552605', 'https://drive.google.com/file/d/1ZB0DP0pDjor9SdgSZDDAHRHBFUtFV9GC/view?usp=drive_link'),
    ('556291', 'https://drive.google.com/file/d/1pGn7aYnizu871bJOg-aSVRAPvmjFmyvz/view?usp=drive_link'),
    ('556287', 'https://drive.google.com/file/d/1G5DTibU12O4pfQ9fpXEWKM2doML_iruk/view?usp=drive_link'),
    ('556280', 'https://drive.google.com/file/d/1uw3Yp8VSEhnFMinsYi--VIUST9eqGvvZ/view?usp=drive_link'),
    ('556172', 'https://drive.google.com/file/d/1FVqCvGMNAsaH-lHY-evhx17PAeYfvwQD/view?usp=drive_link'),
    ('556286', 'https://drive.google.com/file/d/1_-0ZIyhl3eGpm-xsMnLyWfBTVKKRSGxN/view?usp=drive_link'),
    ('556283', 'https://drive.google.com/file/d/1TfXEMXBj9fBnRPPdQ7MJ54sXVNTFbkyO/view?usp=drive_link'),
    ('556290', 'https://drive.google.com/file/d/19yAvU9LXVJOQyUXF4yxNQWp0P7mdeEQO/view?usp=drive_link'),
    ('556289', 'https://drive.google.com/file/d/1t2Lx5q03iiAQQh3habSCfcPnNmca_Jjs/view?usp=drive_link'),
    ('556288', 'https://drive.google.com/file/d/19TToIgca0fwjaf1lLYHKsz8ifhfM7Sl0/view?usp=drive_link'),
    ('556292', 'https://drive.google.com/file/d/1aBWyTt_oBGSv1MJSfr5JKhftAK_wJxK_/view?usp=drive_link'),
    ('556284', 'https://drive.google.com/file/d/1iK5sQrEfSw2-ze0OD18nvpw5UpgGR4ni/view?usp=drive_link'),
    ('556240', 'https://drive.google.com/file/d/1HhnXPZXKgfmSJCqYTeBnxmHWrkxH5dsf/view?usp=drive_link'),
    ('556247', 'https://drive.google.com/file/d/1x5F9qTJviiSK3vq6AgfvL8WY-MosJGbj/view?usp=drive_link')
  ) as v(reference, url)
where p.reference = v.reference;

-- Quedan SIN video (duplicado 552682/552821 y carpeta no reproducible 552697):
update public.products
set video_url = null
where reference in ('552682', '552821', '552697');

-- Verificación (resultado esperado: con_video = 77, total = 90):
select
  count(*) filter (where video_url is not null and video_url <> '') as con_video,
  count(*) as total
from public.products;
