(define-module (util json)
  #:use-module (ice-9 textual-ports)
  #:export (translate-record))

(define (translate-record in-port out-port)
  (define (finished?)
    (let* ([input (get-string-n in-port 2)])
      (if (or (eof-object? input) (equal? input "\n")) 
        #t 
        (begin
          (unget-string in-port input)
          #f))))

  (define (translate-field)
    ; the key part
    (define (translate-identifier)
      ; when we hit a colon, stop reading the key
      (define (finished?)
        (let* ([input (get-string-n in-port 2)]
               [input-chars (string->list input)])
          (if (equal? (car input-chars) #\:)
            #t
            (begin
              (unget-string in-port input)
              #f))))

      (define (translate-identifier-chars)
        (unless (finished?)
          (display (get-char in-port) out-port)
          (translate-identifier-chars)))

      (display #\" out-port)
      (translate-identifier-chars)
      (display "\": " out-port))

    ; the value part
    (define (translate-value)
      (define (finished?)
        (let* ([input (get-string-n in-port 3)]
               [input-chars (string->list input)])
          (cond [(equal? input "\n+ ")
                 (begin
                   (unget-string in-port "\\n")
                   #f)]
                [(and
                   (>= (length input-chars) 3)
                   (equal? (car input-chars) #\newline)
                   (equal? (cadr input-chars) #\+))
                 (begin
                   (display "a")
                   (unget-char in-port (caddr input-chars))
                   (unget-string in-port "\\n")
                   #f)]
                [(and
                   (= 3 (length input-chars))
                   (equal? (car input-chars) #\newline))
                 (begin
                   (unget-char in-port (caddr input-chars))
                   (unget-char in-port (cadr input-chars))
                   #t)]
                [(and
                   (= 2 (length input-chars))
                   (equal? (car input-chars) #\newline))
                 (begin
                   (unget-char in-port (cadr input-chars))
                   #t)]
                [else
                  (begin
                    (unget-string in-port input)
                    #f)])))
      (define (translate-value-characters)
        (unless (finished?)
          (let ([next-char (get-char in-port)])
            (cond [(equal? next-char #\")
                   (display "\\\"" out-port)]
                  [(equal? next-char #\\)
                   (display "\\\\" out-port)]
                  [(equal? next-char #\return)
                   (display "\\r" out-port)]
                  [else
                    (display next-char out-port)]))
          (translate-value-characters)))

      (display #\" out-port)
      (translate-value-characters)
      (display #\" out-port))

    (translate-identifier)
    (translate-value))

  (define (translate-fields first)
    (let ([finished (finished?)])
      (cond
        [(and first (not finished))
         (begin
           (translate-field)
           (translate-fields #f))]
        [(not finished)
         (begin
           (display ",\n" out-port)
           (translate-field)
           (translate-fields #f))])))

  (display "{\n" out-port)
  (translate-fields #t)
  (display "\n}" out-port))

